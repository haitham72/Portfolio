import type { Metadata } from "next";
import { getSimple } from "@/lib/content";
import Simple from "@/components/sections/Simple";
import { SITE } from "@/lib/placeholders";

export const metadata: Metadata = { title: `Preview — ${SITE.brand}` };

/**
 * What a "limited"-access sign-in sees instead of the real site — a real
 * first pass (the Simple gallery), not a blank "pending" holding screen.
 * Full access (flip the row in Supabase's Table Editor) redirects here
 * away to "/" instead — see middleware.ts.
 */
export default function PreviewPage() {
  const items = getSimple();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div>
        <span className="text-ui-sm uppercase tracking-tight text-meta">{SITE.brand}</span>
        <h1 className="mt-2 text-sub-3 tracking-tight text-text-hi">A first look.</h1>
        <p className="mx-auto mt-4 max-w-sm text-body text-text-alt">
          The full site is a private preview right now — this is what&apos;s open so far. Reach out and I&apos;ll
          get you full access.
        </p>
      </div>
      <Simple items={items} />
    </main>
  );
}
