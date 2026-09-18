"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useAnimationFrame, useScroll, useVelocity, useSpring } from "motion/react";
import { prefersReducedMotion } from "@/lib/motion";

interface TickerProps {
  children: ReactNode; // one "unit" — duplicated for a seamless wrap
  speed?: number; // base px/sec
  direction?: 1 | -1; // resting drift direction — alternate per row for a marquee bank
  className?: string;
}

/**
 * rAF-driven translateX (not CSS keyframes) so speed can velocity-couple
 * to scroll. Drifts at `direction` by default (-1 = leftward: content
 * exits left, new content is revealed from the right, the normal marquee
 * convention); scrolling up hard reverses it relative to that base. Pauses
 * on hover. Duplicated content wraps seamlessly by snapping back exactly
 * one copy-width (`half`) once fully traversed — not a moment sooner.
 *
 * Previously this computed `next = x.get() - dx`, which double-flips the
 * sign `dir` already carries: with the default `direction=-1`, x actually
 * *increased* every frame, immediately tripping the `next > 0` wrap and
 * snapping back almost before it moved — logos never travelled anywhere
 * near a full loop, they just jittered near the left edge and popped.
 * `x.get() + dx` is the fix — x decreases steadily for leftward drift,
 * and the wrap only fires after a genuine full-width traversal.
 */
export default function Ticker({ children, speed = 40, direction = -1, className }: TickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const paused = useRef(false);
  const reduced = useRef(prefersReducedMotion());

  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { damping: 40, stiffness: 200 });

  useAnimationFrame((_, delta) => {
    if (paused.current || reduced.current) return;
    const v = smoothVelocity.get();
    const dir = v < -30 ? -direction : direction; // scrolling up hard reverses the drift
    const boost = Math.min(Math.abs(v) * 0.015, 6);
    const dx = ((speed + boost) * dir * delta) / 1000;

    const half = (trackRef.current?.scrollWidth ?? 0) / 2;
    let next = x.get() + dx;
    if (half > 0) {
      if (next <= -half) next += half;
      if (next >= 0) next -= half;
    }
    x.set(next);
  });

  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <motion.div ref={trackRef} style={{ x, display: "inline-flex" }}>
        <span className="inline-flex shrink-0">{children}</span>
        <span className="inline-flex shrink-0" aria-hidden>
          {children}
        </span>
      </motion.div>
    </div>
  );
}
