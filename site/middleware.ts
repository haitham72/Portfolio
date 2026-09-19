import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Private-preview gate. Everything requires Google sign-in; every signed-in
 * email is recorded in Supabase's `users` table with access=DEFAULT_ACCESS
 * on first sign-in (see below) and routed to /preview (a stripped-down
 * look at the site, not the real thing) until you flip the row's `access`
 * checkbox to true in the Supabase dashboard's Table Editor — there's no
 * admin UI in the app itself by design, you're editing the table directly,
 * any time. A notification email fires to NOTIFY_EMAIL the first time any
 * new address signs in, so you know to go check.
 *
 * Every matched request also gets logged to `visits` (email/access aside —
 * this runs even in PUBLIC_MODE, where nothing else in this file executes)
 * so "how many times has this been looked at" is answerable with a plain
 * SQL count, not just "who currently has access." See getClientIp/logVisit.
 *
 * /login and /auth/callback bypass the gate entirely — they must be
 * reachable before a session exists at all, otherwise there's no way to
 * ever reach the login page. /preview is deliberately NOT in this list even
 * though it's also part of the auth flow: it still needs to go through the
 * access check below so a since-approved user gets bounced to "/" instead
 * of refreshing back into /preview forever (an unconditional bypass here
 * used to make that redirect permanently unreachable — see line ~105).
 * /privacy and /terms also bypass — they're plain informational pages, not
 * portfolio work, and Google's OAuth consent screen requires the privacy
 * policy / ToS links it shows to end users to actually be publicly
 * reachable; gated versions would just bounce Google's own review and
 * every visitor straight to /login instead of showing the policy.
 * Static assets under /content/, /_next/*, and favicon.ico never hit this
 * middleware at all (see `config.matcher` below) — gating video byte-range
 * requests would be wasteful and can break seeking.
 */
const BYPASS_PATHS = ["/login", "/auth/callback", "/privacy", "/terms"];

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

// Skips Next's own speculative <Link> prefetches (sent when a link merely
// scrolls into view, not when it's actually clicked) so a `visits` count
// reflects real page loads, not every link a visitor scrolled past. An
// RSC data fetch from an actual click-triggered client-side navigation
// still counts — that IS a real visit, just not a full HTML document GET.
function isRealNavigation(request: NextRequest): boolean {
  return request.method === "GET" && !request.headers.get("next-router-prefetch") && request.headers.get("purpose") !== "prefetch";
}

async function logVisit(request: NextRequest) {
  if (!isRealNavigation(request)) return;
  try {
    const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await service.from("visits").insert({
      path: request.nextUrl.pathname,
      ip: getClientIp(request),
      user_agent: request.headers.get("user-agent") ?? "unknown",
    });
  } catch {
    // best-effort logging — a failed insert must never block the visitor
  }
}

// What a brand-new sign-in's `access` starts as. This is an explicit value
// in the insert below, not the database column's default — changing the
// column default in Supabase alone would do nothing, since an explicit
// value in the insert always wins. Set DEFAULT_ACCESS=true in .env.local
// (and restart the dev server — env vars only load at startup) while
// you're testing so you don't have to hand-approve every throwaway
// account; set it back to false (or just remove it — false is the
// fallback) before sharing the link with anyone else.
const DEFAULT_ACCESS = process.env.DEFAULT_ACCESS === "true";

async function notifyNewSignIn(email: string, ip: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return; // not configured — fail silently, never block sign-in over this

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "HaithamMotion Preview <onboarding@resend.dev>",
        to,
        subject: `New sign-in: ${email}`,
        text: `${email} just signed in from ${ip}.\n\nAccess defaults to limited — approve in Supabase's Table Editor (users table, "access" column) if you want them to see the real site.`,
      }),
    });
  } catch {
    // best-effort notification — a failed email must never block the visitor
  }
}

// Emergency escape hatch: set PUBLIC_MODE=true in Vercel's env vars (then
// redeploy) to drop the gate entirely — no Google sign-in, no /preview,
// everyone with the URL sees the real site. This makes the WHOLE site
// public to anyone who has the link, not just one intended recipient —
// there's no way to bypass auth for a single person without some form of
// auth. Meant to be temporary: flip it back to false (or remove the var)
// and redeploy once the visit that needed it is over.
const PUBLIC_MODE = process.env.PUBLIC_MODE === "true";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // waitUntil, not awaited — a visit log must never add latency to the
  // actual response, and this has no bearing on any decision below.
  event.waitUntil(logVisit(request));

  if (PUBLIC_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Service role client: trusted server-side code only, bypasses RLS. Never
  // import createServiceClient or reference the service-role key from a
  // "use client" file — it must not reach the browser bundle.
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const ip = getClientIp(request);

  const { data: existing } = await service.from("users").select("access").eq("email", user.email).maybeSingle();

  if (!existing) {
    await service.from("users").insert({ email: user.email, ip, access: DEFAULT_ACCESS });
    await notifyNewSignIn(user.email, ip);
  } else {
    await service.from("users").update({ ip, last_seen_at: new Date().toISOString() }).eq("email", user.email);
  }

  const access = existing?.access ?? DEFAULT_ACCESS;

  if (!access && pathname !== "/preview") {
    return NextResponse.redirect(new URL("/preview", request.url));
  }
  if (access && pathname === "/preview") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|content/).*)"],
};
