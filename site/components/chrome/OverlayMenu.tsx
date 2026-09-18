"use client";

import { motion, AnimatePresence } from "motion/react";
import { ease, dur } from "@/lib/motion";
import { SITE } from "@/lib/placeholders";

const LINKS = [
  { n: "01", label: "Work", href: "#selected-work" },
  { n: "02", label: "Reels", href: "#reels" },
  { n: "03", label: "Toolkit", href: "#toolkit" },
  { n: "04", label: "About", href: "#about" },
];

interface OverlayMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Fullscreen takeover menu — numbered items, contact, copyright. Opens over everything. */
export default function OverlayMenu({ open, onClose }: OverlayMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex flex-col justify-between bg-bg px-6 py-10 sm:px-16 sm:py-16"
          initial={{ clipPath: "inset(0% 0 100% 0)" }}
          animate={{ clipPath: "inset(0% 0 0% 0)" }}
          exit={{ clipPath: "inset(0% 0 100% 0)" }}
          transition={{ duration: dur.base, ease: ease.out }}
        >
          <div className="flex items-center justify-between">
            <span className="text-ui uppercase tracking-tight text-meta">Menu</span>
            <button onClick={onClose} className="btn-pill btn-pill--outline text-ui-sm" aria-label="Close menu">
              Close
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="group flex items-baseline gap-4 py-2 text-text-alt transition-colors hover:text-text-hi"
              >
                <span className="tnum text-ui text-meta">{link.n}</span>
                <span className="text-[3rem] tracking-tight sm:text-sub-2">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <a href="#book" onClick={onClose} className="btn-pill btn-pill--solid w-fit">
              Get in touch
            </a>
            <div className="flex flex-col gap-1 text-ui-sm text-meta sm:items-end">
              <a href={`mailto:${SITE.email}`} className="hover:text-text">
                {SITE.email}
              </a>
              <a href={`tel:${SITE.phoneHref}`} className="tnum hover:text-text">
                {SITE.phone}
              </a>
              <span>&copy; 2026</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
