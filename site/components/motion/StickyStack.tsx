"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface StickyStackItemProps {
  index: number;
  children: ReactNode;
  className?: string;
}

/**
 * Selected Work's pinned, overlapping card stack (PLAN.md §5.1, §5.2 #5).
 * Each card gets its own tall (140vh) scroll track with a sticky h-screen
 * inner — the sticky pin IS the mechanism, useScroll only drives the
 * scale/opacity/blur breathe on top of it. As the next card's track starts
 * covering this one, this card scales down, dims and blurs — never the
 * wheel event itself.
 */
export function StickyStackItem({ index, children, className }: StickyStackItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
  const blurPx = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`);

  return (
    <div ref={ref} className="relative h-[140vh]">
      <div
        className={`sticky top-0 flex h-screen items-center justify-center overflow-hidden ${className ?? ""}`}
        style={{ zIndex: index + 1 }}
      >
        <motion.div style={{ scale, opacity, filter }} className="w-full will-change-transform">
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function StickyStack({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>;
}
