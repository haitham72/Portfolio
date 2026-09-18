"use client";

import { motion } from "motion/react";
import { ease, dur, stagger, viewportOnce } from "@/lib/motion";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface SplitTextProps {
  children: string;
  as?: Tag;
  splitBy?: "char" | "word";
  className?: string;
  delay?: number;
}

/**
 * Explodes text into one span per character (or word), each in an
 * overflow-hidden mask animating y:100%→0 + opacity. This is why the
 * reference site's DOM has one span per character on every headline —
 * a staggered per-unit reveal, not a decorative flourish (PLAN.md item 7).
 * Screen readers get the real string via aria-label; the exploded spans
 * are aria-hidden.
 */
export default function SplitText({
  children,
  as = "span",
  splitBy = "char",
  className,
  delay = 0,
}: SplitTextProps) {
  const Component = motion[as];
  const units = splitBy === "char" ? Array.from(children) : children.split(/(\s+)/);

  return (
    <Component className={className} aria-label={children}>
      {units.map((unit, i) => {
        if (splitBy === "word" && /^\s+$/.test(unit)) {
          return (
            <span key={i} aria-hidden>
              {unit}
            </span>
          );
        }
        return (
          <span key={i} className="char-mask" aria-hidden>
            <motion.span
              initial={{ y: "100%", opacity: 0.001 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={viewportOnce}
              transition={{
                duration: dur.chrome,
                ease: ease.out,
                delay: delay + i * stagger.char,
              }}
            >
              {unit === " " ? " " : unit}
            </motion.span>
          </span>
        );
      })}
    </Component>
  );
}
