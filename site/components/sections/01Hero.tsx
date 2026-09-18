"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import SplitText from "@/components/motion/SplitText";
import Reveal from "@/components/motion/Reveal";
import RecTimer from "@/components/motion/RecTimer";
import LazyVideo from "@/components/media/LazyVideo";
import PosterImage from "@/components/media/PosterImage";
import ViewfinderFrame from "@/components/media/ViewfinderFrame";
import { ease, dur, zoom } from "@/lib/motion";
import { gradientFor, SITE, COPY } from "@/lib/placeholders";
import { useSkipLoadSequence } from "@/components/chrome/LoadSequenceProvider";
import type { HeroContent } from "@/lib/content";

const RULER = ["00:00", "00:30", "01:00", "01:30", "02:00"];

export default function Hero({ hero }: { hero: HeroContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollScale = useTransform(scrollYProgress, [0, 1], [zoom.rest, zoom.out]);
  const skip = useSkipLoadSequence();

  return (
    <section id="top" ref={ref} className="relative h-[140vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div initial={skip ? false : { scale: zoom.in }} animate={{ scale: zoom.rest }} transition={{ duration: dur.hero, ease: ease.out }} className="absolute inset-0">
          <motion.div style={{ scale: scrollScale }} className="absolute inset-0 will-change-transform">
            {hero.background ? hero.background.kind === "video" ? (
              <LazyVideo src={hero.background.src} poster={hero.background.poster} className="h-full w-full" gradient={gradientFor(0)} />
            ) : (
              <PosterImage src={hero.background.src} alt="" className="h-full w-full" priority gradient={gradientFor(0)} />
            ) : <div className="h-full w-full" style={{ background: gradientFor(0) }} />}
            <div className="absolute inset-0 bg-bg/45" />
          </motion.div>
        </motion.div>
        <motion.div initial={skip ? false : { opacity: 0.001 }} animate={{ opacity: 0.3 }} transition={{ duration: dur.hero, ease: ease.out, delay: 0.25 }} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-4vw] select-none text-center text-[20vw] font-semibold leading-none tracking-tighter text-text-hi">MOTION</motion.div>
        <ViewfinderFrame />
        <div className="absolute inset-x-6 top-24 flex justify-between text-ui-sm tnum text-meta sm:inset-x-10">{RULER.map((t) => <div key={t} className="flex flex-col items-center gap-1"><span className="h-2 w-px bg-meta/50" /><span>{t}</span></div>)}</div>
        <div className="absolute left-6 top-6 sm:left-10 sm:top-8"><RecTimer /></div>
        <div className="absolute inset-x-6 bottom-28 sm:inset-x-10 sm:bottom-32">
          <h1 className="block max-w-4xl">
            <SplitText as="div" className="block text-[1.75rem] leading-[0.95] tracking-tight text-text-hi sm:text-[2.625rem] md:text-[3.375rem]">{COPY.heroLine1}</SplitText>
            <SplitText as="div" delay={0.25} className="block text-[1.75rem] leading-[0.95] tracking-tight text-text-alt sm:text-[2.625rem] md:text-[3.375rem]">{COPY.heroLine2}</SplitText>
            <SplitText as="div" delay={0.45} className="block text-[1.75rem] leading-[0.95] tracking-tight text-text-alt sm:text-[2.625rem] md:text-[3.375rem]">{COPY.heroLine3}</SplitText>
          </h1>
          <Reveal delay={0.9} className="mt-6 max-w-md text-body text-text-alt">{COPY.heroSub}</Reveal>
        </div>
        <Reveal delay={1.15} y={-8} className="absolute right-6 top-28 hidden w-40 overflow-hidden rounded-lg border border-text-alt/10 sm:right-10 sm:block sm:w-48"><PosterImage src={hero.portrait} alt={SITE.name} className="aspect-[3/4] w-full" gradient={gradientFor(1)} /></Reveal>
      </div>
    </section>
  );
}
