"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring, useMotionValueEvent } from "motion/react";
import { prefersReducedMotion } from "@/lib/motion";

interface CountUpProps {
  value: string; // e.g. "120+", "24H", "7+" — leading numeric portion animates, suffix stays static
  className?: string;
}

/** Spring-driven count-up, tabular-nums, fires once on enter. */
export default function CountUp({ value, className }: CountUpProps) {
  const match = value.match(/^(\d+(?:\.\d+)?)/);
  const numeric = match ? parseFloat(match[1]) : null;
  const suffix = match ? value.slice(match[1].length) : value;

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 120, damping: 22, mass: 1 });
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(spring, "change", (v) => setDisplay(Math.round(v)));

  useEffect(() => {
    if (!inView || numeric === null) return;
    if (prefersReducedMotion()) {
      motionVal.jump(numeric);
      return;
    }
    motionVal.set(numeric);
  }, [inView, numeric, motionVal]);

  if (numeric === null) {
    return (
      <span ref={ref} className={`tnum ${className ?? ""}`}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {display}
      {suffix}
    </span>
  );
}
