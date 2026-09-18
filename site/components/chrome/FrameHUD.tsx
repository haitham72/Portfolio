"use client";

import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

const TOTAL_FRAMES = 9999;

/** Persistent bottom HUD — scroll-linked FRAME counter, Play, booking CTA. */
export default function FrameHUD() {
  const textRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!textRef.current) return;
    const frame = Math.min(TOTAL_FRAMES, Math.max(0, Math.floor(v * TOTAL_FRAMES)));
    textRef.current.textContent = frame.toString().padStart(4, "0");
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-gradient-to-t from-bg/70 to-transparent px-6 py-4 backdrop-blur-[2px] sm:px-10">
      <span className="tnum text-ui-sm text-meta">
        FRAME <span ref={textRef}>0000</span>
      </span>
      <a href="#reels" className="btn-pill btn-pill--outline text-ui-sm">
        &#9656; Play
      </a>
      <a href="#book" className="btn-pill btn-pill--solid hidden text-ui-sm sm:inline-flex">
        Book a call
      </a>
    </div>
  );
}
