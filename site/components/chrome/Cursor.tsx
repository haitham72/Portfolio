"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Dot + label cursor, lerped follow. Fine-pointer desktop only. Grows on hover, shows PLAY over video. */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine && !prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const target = e.target as HTMLElement;
      const interactive = target.closest("a, button, [data-cursor-label]");
      setHovering(!!interactive);
      const custom = target.closest("[data-cursor-label]") as HTMLElement | null;
      setLabel(custom?.dataset.cursorLabel ?? (target.closest("video") ? "PLAY" : null));
    }

    function loop() {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed left-0 top-0 z-[80] flex items-center justify-center rounded-full mix-blend-difference transition-[width,height] duration-200 ease-out"
      style={{ width: hovering ? 64 : 10, height: hovering ? 64 : 10, background: "var(--text-hi)" }}
    >
      {label && <span className="tnum text-[10px] text-bg">{label}</span>}
    </div>
  );
}
