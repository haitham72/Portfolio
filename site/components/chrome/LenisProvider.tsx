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
    // Every nav link (Header, Footer, FrameHUD's Play, the overlay menu)
    // points at an in-page hash like #reels — clicking one leaves that hash
    // sitting in the URL. Reload, revisit, or share that URL later and the
    // BROWSER's own native behavior jumps straight to that section before
    // React even hydrates, completely bypassing every scroll-jacking hook
    // here. Hero/Selected Work never get their normal scroll-into-view
    // trigger, which is also why videos above the landing point never
    // autoplayed. These pinned sections only make sense entered from the
    // top — always force it, regardless of any hash or the browser's own
    // scroll-position memory.
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

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
