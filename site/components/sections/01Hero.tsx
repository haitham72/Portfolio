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
    <section id="top" ref={ref} className="relative h-[140dvh] min-h-[680px] supports-[height:100vh]:h-[140vh]">
      <div className="sticky top-0 h-[100dvh] min-h-[680px] overflow-hidden supports-[height:100vh]:h-screen">
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

        <motion.div initial={skip ? false : { opacity: 0.001 }} animate={{ opacity: 0.3 }} transition={{ duration: dur.hero, ease: ease.out, delay: 0.25 }} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-4vw] select-none text-center text-[20vw] font-semibold leading-none tracking-tighter text-text-hi">
          MOTION
        </motion.div>
        <ViewfinderFrame />

        <div className="absolute inset-x-[max(1.5rem,env(safe-area-inset-left))] top-[max(6rem,calc(6rem+env(safe-area-inset-top)))] flex max-w-[calc(100%-3rem)] justify-between text-ui-sm tnum text-meta sm:inset-x-10">
          {RULER.map((t) => <div key={t} className="flex flex-col items-center gap-1"><span className="h-2 w-px bg-meta/50" /><span>{t}</span></div>)}
        </div>
        <div className="absolute left-[max(1.5rem,env(safe-area-inset-left))] top-[max(1.5rem,calc(1.5rem+env(safe-area-inset-top)))] sm:left-10 sm:top-8"><RecTimer /></div>

        <div className="absolute inset-x-6 bottom-[max(7rem,calc(7rem+env(safe-area-inset-bottom)))] mx-auto grid w-[calc(100%-3rem)] max-w-[1200px] items-end gap-8 sm:inset-x-10 sm:w-[calc(100%-5rem)] lg:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="min-w-0">
            <h1 className="block max-w-4xl">
              <SplitText as="div" className="block text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-tight text-text-hi">{COPY.heroLine1}</SplitText>
              <SplitText as="div" delay={0.25} className="block text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-tight text-text-alt">{COPY.heroLine2}</SplitText>
              <SplitText as="div" delay={0.45} className="block text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-tight text-text-alt">{COPY.heroLine3}</SplitText>
            </h1>
            <Reveal delay={0.9} className="mt-6 max-w-md text-body text-text-alt">{COPY.heroSub}</Reveal>
          </div>
          {hero.portrait && <Reveal delay={1.15} y={-8} className="hidden w-40 justify-self-end overflow-hidden rounded-lg border border-text-alt/10 lg:block lg:w-48"><PosterImage src={hero.portrait} alt={SITE.name} className="aspect-[3/4] w-full" gradient={gradientFor(1)} /></Reveal>}
        </div>
      </div>
    </section>
  );
}
