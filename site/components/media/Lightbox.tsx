"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ease, dur } from "@/lib/motion";

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  children: ReactNode;
}

/** Fullscreen modal — Esc closes, arrows navigate, click-outside closes. */
export default function Lightbox({ open, onClose, onNext, onPrev, children }: LightboxProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onNext, onPrev]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/95 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.chrome, ease: ease.out }}
          onClick={onClose}
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {/* On the card's own corner, not the viewport's — at 92vw wide on
                a phone the card fills almost the whole screen, so a button
                pinned to the viewport's top-right sat underneath it and was
                unreachable. Click-outside (the backdrop's own onClick above)
                and Esc both still close it too. */}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-bg/80 text-lg text-text-hi backdrop-blur-sm"
            >
              <span aria-hidden>&times;</span>
            </button>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
