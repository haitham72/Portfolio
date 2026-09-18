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
          <button className="btn-pill btn-pill--outline absolute right-6 top-6 text-ui-sm" onClick={onClose}>
            Close (Esc)
          </button>
          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
