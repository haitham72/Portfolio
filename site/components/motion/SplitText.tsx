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

function Char({ ch, index, delay }: { ch: string; index: number; delay: number }) {
  return (
    <span className="char-mask" aria-hidden>
      <motion.span
        initial={{ y: "100%", opacity: 0.001 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={viewportOnce}
        transition={{
          duration: dur.chrome,
          ease: ease.out,
          delay: delay + index * stagger.char,
        }}
      >
        {ch === " " ? " " : ch}
      </motion.span>
    </span>
  );
}

/**
 * Explodes text into one span per character (or word), each in an
 * overflow-hidden mask animating y:100%→0 + opacity. This is why the
 * reference site's DOM has one span per character on every headline —
 * a staggered per-unit reveal, not a decorative flourish (PLAN.md item 7).
 * Screen readers get the real string via aria-label; the exploded spans
 * are aria-hidden.
 *
 * Text is split into words first either way, each word wrapped in its own
 * inline-block — .char-mask's per-character spans are inline-block with no
 * space characters between them, so a run of them reads as one unbreakable
 * unit to the browser's line-wrapper and it can only break between words,
 * same as normal text. Splitting straight into characters with no word
 * grouping let the browser break a line between ANY two characters,
 * including mid-word — that's what produced "Haitham Moh|amed" on narrow
 * viewports.
 */
export default function SplitText({
  children,
  as = "span",
  splitBy = "char",
  className,
  delay = 0,
}: SplitTextProps) {
  const Component = motion[as];
  const words = children.split(/(\s+)/);
  let charIndex = 0;

  return (
    <Component className={className} aria-label={children}>
      {words.map((word, wi) => {
        if (/^\s+$/.test(word)) {
          return (
            <span key={wi} aria-hidden>
              {word}
            </span>
          );
        }
        if (splitBy === "word") {
          const i = charIndex;
          charIndex += 1;
          return <Char key={wi} ch={word} index={i} delay={delay} />;
        }
        const chars = Array.from(word);
        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {chars.map((ch, ci) => {
              const i = charIndex;
              charIndex += 1;
              return <Char key={ci} ch={ch} index={i} delay={delay} />;
            })}
          </span>
        );
      })}
    </Component>
  );
}
