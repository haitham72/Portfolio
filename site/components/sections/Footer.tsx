import Link from "next/link";
import { SITE } from "@/lib/placeholders";

const HOURS_RULER = ["00:00", "03:00", "06:00", "09:00", "12:00"];
const NAV = [
  { label: "Work", href: "#selected-work" },
  { label: "Reels", href: "#reels" },
  { label: "Toolkit", href: "#toolkit" },
  { label: "About", href: "#about" },
  { label: "Book", href: "#book" },
];

export default function Footer() {
  return (
    <footer className="border-t border-text-alt/10 px-6 pb-32 pt-16 sm:px-10">
      <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
        <div>
          <span className="tnum text-ui-sm text-meta">(00) &mdash; STUDIO</span>
          <p className="mt-4 max-w-xs text-body text-text-alt">
            One person, every frame — motion design for brands and broadcasters who need film-grade craft on a
            deadline.
          </p>
        </div>

        <div>
          <span className="tnum text-ui-sm text-meta">(01) &mdash; NAVIGATION</span>
          <nav className="mt-4 flex flex-col gap-2">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="w-fit text-ui text-text-alt transition-colors hover:text-text-hi">
                {n.label}
              </a>
            ))}
            <Link href="/privacy" className="w-fit text-ui text-text-alt transition-colors hover:text-text-hi">
              Privacy
            </Link>
            <Link href="/terms" className="w-fit text-ui text-text-alt transition-colors hover:text-text-hi">
              Terms
            </Link>
          </nav>
        </div>

        <div>
          <span className="tnum text-ui-sm text-meta">(02) &mdash; VISIT US</span>
          <p className="mt-4 text-body text-text-alt">{SITE.location} &middot; by appointment</p>
          <div className="mt-3 flex flex-col gap-1 text-ui text-text-alt">
            <a href={`mailto:${SITE.email}`} className="w-fit transition-colors hover:text-text-hi">
              {SITE.email}
            </a>
            <a href={`tel:${SITE.phoneHref}`} className="tnum w-fit transition-colors hover:text-text-hi">
              {SITE.phone}
            </a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="w-fit transition-colors hover:text-text-hi">
              LinkedIn
            </a>
          </div>
          <div className="mt-4 flex justify-between text-ui-sm tnum text-meta">
            {HOURS_RULER.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <a
        href="#top"
        className="mt-24 block select-none bg-gradient-to-b from-text-alt/25 to-transparent bg-clip-text text-center text-[16vw] font-semibold leading-none tracking-tighter text-transparent"
      >
        {SITE.brand}
      </a>

      <div className="mt-8 flex flex-col items-center gap-2 text-ui-sm text-meta">
        <a href="#top" className="hover:text-text">
          Back to top &uarr;
        </a>
        <span>&copy; 2026 {SITE.name}. All rights reserved.</span>
      </div>
    </footer>
  );
}
