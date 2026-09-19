"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { ease, dur, viewportOnce } from "@/lib/motion";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "transition"> {
  delay?: number;
  y?: number;
  duration?: number;
  /** "view" (default) reveals on scroll-into-view, once. "mount" reveals
   *  immediately on mount — for above-the-fold content already visible at
   *  rest. "none" skips the animation and renders straight in the rested
   *  state (used for the load-cascade's own "already played" case). */
  trigger?: "view" | "mount" | "none";
}

/** Generic block reveal: y → 0, opacity 0 → 1, the standard non-pinned entrance. */
export default function Reveal({ children, delay = 0, y = 32, duration = dur.base, className, trigger = "view", ...rest }: RevealProps) {
  const transition = { duration, ease: ease.out, delay };

  if (trigger === "none") {
    return (
      <motion.div className={className} {...rest}>
        {children}
      </motion.div>
    );
  }

  if (trigger === "mount") {
    return (
      <motion.div initial={{ y, opacity: 0.001 }} animate={{ y: 0, opacity: 1 }} transition={transition} className={className} {...rest}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y, opacity: 0.001 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={viewportOnce}
      transition={transition}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
