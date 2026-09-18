"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { ease, dur, viewportOnce } from "@/lib/motion";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "transition"> {
  delay?: number;
  y?: number;
  duration?: number;
}

/** Generic block reveal: y → 0, opacity 0 → 1, the standard non-pinned entrance. */
export default function Reveal({ children, delay = 0, y = 32, duration = dur.base, className, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ y, opacity: 0.001 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={viewportOnce}
      transition={{ duration, ease: ease.out, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
