"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
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
  // useLayoutEffect (not useEffect) so this reset commits before the browser
  // paints. The root layout's own `beforeInteractive` script already strips
  // a hash from the URL before <body> is even parsed (see app/layout.tsx) —
  // this is the second layer, for the plain case of a mid-page scroll
  // position the browser restored on its own (no hash involved). Also
  // re-asserted on the next frame and on `load`, since late-arriving layout
  // (fonts, images, video metadata) can itself shift scroll position after
  // this first synchronous call.
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    const onLoad = () => window.scrollTo(0, 0);
    window.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    // Every nav link (Header, Footer, FrameHUD's Play, the overlay menu)
    // points at an in-page hash like #reels. Lenis's anchors:true smooth-
    // scrolls to it correctly, but the hash itself is left sitting in the
    // URL afterward — reload or revisit that URL later and the browser's
    // own native fragment-scroll jumps straight there before React
    // hydrates, bypassing every scroll-jacking hook in this app. Strip it
    // right after the click does its job, so no hash ever survives into a
    // future page load to begin with.
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a[href^='#']");
      if (!link) return;
      window.setTimeout(() => {
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      }, 0);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

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
