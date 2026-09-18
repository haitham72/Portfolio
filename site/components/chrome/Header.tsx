"use client";

import { useState } from "react";
import OverlayMenu from "./OverlayMenu";
import { SITE, COPY } from "@/lib/placeholders";

const NAV = [
  { label: "Work", href: "#selected-work" },
  { label: "Reels", href: "#reels" },
  { label: "Toolkit", href: "#toolkit" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-bg/70 to-transparent px-6 py-5 backdrop-blur-[2px] sm:px-10">
        <a href="#top" className="text-ui-sm uppercase tracking-tight text-text-hi">
          {SITE.brand}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-ui text-text-alt transition-colors hover:text-text-hi">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#book" className="btn-pill btn-pill--solid hidden sm:inline-flex">
            {COPY.bookingCta}
          </a>
          <button
            onClick={() => setOpen(true)}
            className="btn-pill btn-pill--outline text-ui-sm"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            Menu
          </button>
        </div>
      </header>
      <OverlayMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
