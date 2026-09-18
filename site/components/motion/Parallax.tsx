"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // 0.85 background, 1 midground (no-op), 1.15 foreground
  className?: string;
}

/** Layered parallax inside a pinned section — small differences only. */
export default function Parallax({ children, speed = 1, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const travel = 60 * (speed - 1); // px of extra drift relative to midground
  const y = useTransform(scrollYProgress, [0, 1], [`${-travel}px`, `${travel}px`]);

  if (speed === 1) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
