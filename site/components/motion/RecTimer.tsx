"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const FPS = 24;

function formatTimecode(ms: number): string {
  const totalFrames = Math.floor(ms / (1000 / FPS));
  const frames = totalFrames % FPS;
  const totalSeconds = Math.floor(totalFrames / FPS);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Live REC timecode — HH:MM:SS:FF at 24fps, counting up from mount.
 * Writes directly to a ref's textContent (not React state) so a 24Hz
 * tick never re-renders the component tree.
 */
export default function RecTimer({ className }: { className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    let rafId = 0;
    function tick(now: number) {
      if (textRef.current) textRef.current.textContent = formatTimecode(now - start);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <span className={`inline-flex items-center gap-2 tnum ${className ?? ""}`}>
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rec opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rec" />
      </span>
      <span ref={textRef}>00:00:00:00</span>
    </span>
  );
}
