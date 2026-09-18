import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Private-preview gate. Everything requires Google sign-in; every signed-in
 * email is recorded in Supabase's `users` table with access=false on first
 * sign-in and routed to /preview (a stripped-down look at the site, not the
 * real thing) until you flip the row's `access` checkbox to true in the
 * Supabase dashboard's Table Editor — there's no admin UI in the app itself
 * by design, you're editing the table directly, any time. A notification
 * email fires to NOTIFY_EMAIL the first time any new address signs in, so
 * you know to go check.
 *
 * Auth-flow pages (/login, /auth/callback, /preview) bypass the gate so the
 * redirect loop has somewhere to land. Static assets under /content/,
 * /_next/*, and favicon.ico never hit this middleware at all (see
 * `config.matcher` below) — gating video byte-range requests would be
 * wasteful and can break seeking.
 */
const BYPASS_PATHS = ["/login", "/auth/callback", "/preview"];

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

export async function middleware(request: NextRequest) {
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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

  const { data: existing } = await service.from("users").select("access").eq("email", user.email).maybeSingle();

  if (!existing) {
    await service.from("users").insert({ email: user.email, ip, access: false });
    await notifyNewSignIn(user.email, ip);
  } else {
    await service.from("users").update({ ip, last_seen_at: new Date().toISOString() }).eq("email", user.email);
  }

  const access = existing?.access ?? false;

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
