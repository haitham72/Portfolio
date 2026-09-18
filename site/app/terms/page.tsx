import type { Metadata } from "next";
import Footer from "@/components/sections/Footer";
import { SITE } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Terms — HaithamMotion" };

export default function TermsPage() {
  return (
    <main className="pt-32">
      <div className="mx-auto max-w-2xl px-6 pb-24 sm:px-10">
        <h1 className="text-sub-2 tracking-tight text-text-hi">Terms of Use</h1>
        <p className="mt-4 text-ui-sm text-meta">Last updated: 2026</p>

        <div className="mt-12 flex flex-col gap-8 text-body text-text-alt">
          <section>
            <h2 className="text-body-lg text-text-hi">Portfolio content</h2>
            <p className="mt-2">
              Work shown on this site is presented for portfolio and hiring-review purposes. Client names,
              where shown, are used with permission; unnamed or placeholder work is labelled as such.
            </p>
          </section>
          <section>
            <h2 className="text-body-lg text-text-hi">No warranty</h2>
            <p className="mt-2">
              This site is provided as-is. While every effort is made to keep it accurate and available,
              no guarantee is made regarding uptime or error-free operation.
            </p>
          </section>
          <section>
            <h2 className="text-body-lg text-text-hi">Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent to{" "}
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
