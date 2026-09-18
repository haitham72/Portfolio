"use client";

import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useSound } from "./SoundProvider";

const TOTAL_FRAMES = 9999;

/** Persistent bottom HUD — scroll-linked FRAME counter, play-only media control, booking CTA. */
export default function FrameHUD() {
  const textRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll();
  const { muted, toggleMuted } = useSound();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!textRef.current) return;
    const frame = Math.min(TOTAL_FRAMES, Math.max(0, Math.floor(v * TOTAL_FRAMES)));
    textRef.current.textContent = frame.toString().padStart(4, "0");
  });

  function playCurrentMedia() {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video"));
    const current = videos.map((video) => {
      const rect = video.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return { video, area: width * height };
    }).filter(({ video, area }) => area > 0 && !video.controls && video.paused).sort((a, b) => b.area - a.area)[0]?.video;
    if (current) { current.muted = muted; current.play().catch(() => {}); }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-t from-bg/70 to-transparent px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:px-10">
      <span className="tnum text-ui-sm text-meta">FRAME <span ref={textRef}>0000</span></span>
      <div className="flex items-center gap-3">
        <button onClick={toggleMuted} className="btn-pill btn-pill--outline text-ui-sm" aria-pressed={!muted} aria-label={muted ? "Unmute video sound" : "Mute video sound"}>
          <span aria-hidden>{muted ? "🔇" : "🔊"}</span><span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
        </button>
        <button type="button" onClick={playCurrentMedia} className="btn-pill btn-pill--outline min-h-12 min-w-[7.5rem] px-5 text-ui-sm" aria-label="Play the visible video">
          <span aria-hidden className="text-base">▶</span><span>Play</span>
        </button>
        <a href="#book" className="btn-pill btn-pill--solid hidden text-ui-sm sm:inline-flex">Book a call</a>
      </div>
    </div>
  );
}
