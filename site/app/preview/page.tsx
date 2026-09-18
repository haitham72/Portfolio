import type { Metadata } from "next";
import { getSimple } from "@/lib/content";
import Simple from "@/components/sections/Simple";
import { SITE } from "@/lib/placeholders";

export const metadata: Metadata = { title: `${SITE.brand} — ${SITE.title}` };

/**
 * What a not-yet-approved sign-in sees instead of the real site — reads as
 * a complete, self-contained page on its own, not a "you're restricted"
 * holding screen. No mention of access levels, approval, or the real site
 * existing at all — that framing was counterintuitive, tipping visitors
 * off to a restriction rather than just showing them something. Full
 * access (flip the row in Supabase's Table Editor) redirects away from
 * here to "/" instead — see middleware.ts.
 */
export default function PreviewPage() {
  const items = getSimple();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div>
        <span className="text-ui-sm uppercase tracking-tight text-meta">{SITE.brand}</span>
        <h1 className="mt-2 text-sub-3 tracking-tight text-text-hi">{SITE.name}</h1>
        <p className="mt-1 text-ui text-meta">{SITE.title}</p>
      </div>
      <Simple items={items} />
    </main>
  );
}
