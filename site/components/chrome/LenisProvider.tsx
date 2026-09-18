"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { frame, cancelFrame } from "motion";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Bridges Lenis's internal clock into Framer Motion's own frame scheduler
 * so smooth scroll and every scroll-linked useScroll()/useTransform() in
 * the app share one rAF tick. Driving Lenis from a bare requestAnimationFrame
 * loop instead introduces a one-frame lag against Motion's batched reads,
 * which is exactly the jitter this project can't afford (PLAN.md §5.2 #1).
 *
 * prefers-reduced-motion: Lenis is never constructed — scroll stays fully
 * native and instant, no smoothing, no inertia.
 */
export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      syncTouch: false,
      anchors: true,
      autoRaf: false,
    });

    function update(data: { timestamp: number }) {
      lenis.raf(data.timestamp);
    }
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
