import type { Metadata } from "next";
import Footer from "@/components/sections/Footer";
import { SITE } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Privacy — HaithamMotion" };

export default function PrivacyPage() {
  return (
    <main className="pt-32">
      <div className="mx-auto max-w-2xl px-6 pb-24 sm:px-10">
        <h1 className="text-sub-2 tracking-tight text-text-hi">Privacy Policy</h1>
        <p className="mt-4 text-ui-sm text-meta">Last updated: 2026</p>

        <div className="mt-12 flex flex-col gap-8 text-body text-text-alt">
          <section>
            <h2 className="text-body-lg text-text-hi">What this site collects</h2>
            <p className="mt-2">
              This site does not use analytics, tracking cookies, or third-party ad scripts. The only
              personal information it handles is what you choose to submit through the booking form —
              your name, email address and project brief — which is sent directly to my email via a
              standard mailto link. It is not stored in a database on this site.
            </p>
          </section>
          <section>
            <h2 className="text-body-lg text-text-hi">How it&apos;s used</h2>
            <p className="mt-2">
              Information you submit is used solely to respond to your enquiry. It is not sold, shared, or
              used for marketing without your explicit consent.
            </p>
          </section>
          <section>
            <h2 className="text-body-lg text-text-hi">Contact</h2>
            <p className="mt-2">
              Questions about this policy can be sent to{" "}
              <a href={`mailto:${SITE.email}`} className="text-text-hi hover:text-rec">
                {SITE.email}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
