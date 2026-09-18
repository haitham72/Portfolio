"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import SectionHeader from "@/components/motion/SectionHeader";
import SplitText from "@/components/motion/SplitText";
import PhoneFrame from "@/components/media/PhoneFrame";
import { useSound, claimExclusiveSound } from "@/components/chrome/SoundProvider";
import { gradientFor } from "@/lib/placeholders";
import { ease, prefersReducedMotion } from "@/lib/motion";
import type { ReelItem } from "@/lib/content";

const swipeVariants = { enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }), center: { y: "0%", opacity: 1 }, exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }) };

export default function Reels({ reels }: { reels: ReelItem[] }) {
  const items = reels.length > 0 ? reels : [{ slug: "placeholder", order: 1, title: "Reel", event: "", year: "", description: "", src: "", poster: null }];
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevActiveRef = useRef(0);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [runtime, setRuntime] = useState("--:--");
  const [reduced, setReduced] = useState(false);
  const { muted } = useSound();
  useEffect(() => setReduced(prefersReducedMotion()), []);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end start"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Exactly one equal 160vh step per reel. No extra final half-step.
    const idx = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)));
    if (idx !== prevActiveRef.current) { setDir(idx > prevActiveRef.current ? 1 : -1); prevActiveRef.current = idx; setActive(idx); }
  });
  const current = items[active];
  const hasMedia = Boolean(current.src);
  useEffect(() => { setRuntime("--:--"); const v = videoRef.current; if (v && v.readyState >= 1) setRuntime(formatRuntime(v.duration)); }, [active]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { claimExclusiveSound(v); v.play().catch(() => {}); } else v.pause(); }, { threshold: 0.1 });
    io.observe(v);
    return () => io.disconnect();
  }, [current.slug]);
  const trackVh = Math.max(items.length, 1) * 160;
  return <section id="reels" className="relative" style={{ height: `${trackVh}vh` }}><div ref={trackRef} className="absolute inset-0" /><div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center gap-8 overflow-hidden px-6 supports-[height:100vh]:h-screen sm:px-10"><SectionHeader number="04" title="Reels" className="self-start" /><h2 className="self-start text-sub-4 tracking-tight text-text-hi"><SplitText as="span" splitBy="word">Short</SplitText> <span className="text-text-alt/60">/</span> <SplitText as="span" splitBy="word" delay={0.1}>Form</SplitText></h2><div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-10"><AnimatePresence mode="wait"><motion.div key={`${current.slug}-event`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-[10rem] text-center lg:w-40 lg:text-right">{current.event && <p className="text-ui-sm uppercase tracking-tight text-meta">{current.event}</p>}<p className="mt-1 text-ui text-text-alt">Mobile View</p></motion.div></AnimatePresence><PhoneFrame><div className="relative h-full w-full overflow-hidden bg-surface"><AnimatePresence initial={false} custom={dir}><motion.div key={current.slug} custom={dir} variants={reduced ? undefined : swipeVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: ease.out }} className="absolute inset-0" style={{ background: hasMedia ? undefined : gradientFor(active) }}>{hasMedia && <video ref={videoRef} data-sound-managed="true" className="h-full w-full object-cover" src={current.poster ? current.src : `${current.src}#t=0.1`} poster={current.poster ?? undefined} muted={muted} loop={!reduced} autoPlay={!reduced} controls={reduced} playsInline preload="metadata" onLoadedMetadata={(e) => setRuntime(formatRuntime(e.currentTarget.duration))} />}{!hasMedia && <div className="h-full w-full" />}</motion.div></AnimatePresence><div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-6 pt-4 text-ui-sm text-text-hi"><span className="border-b border-text-hi pb-1">Reels</span><span className="text-text-alt/60">Friends</span></div></div></PhoneFrame><AnimatePresence mode="wait"><motion.div key={`${current.slug}-desc`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-[10rem] text-center lg:w-40 lg:text-left">{current.description && <p className="text-ui text-text-alt">{current.description}</p>}</motion.div></AnimatePresence></div><div className="flex gap-1.5">{items.map((item, i) => <span key={item.slug} className={`h-1 w-6 rounded-full transition-colors ${i === active ? "bg-rec" : "bg-text-alt/20"}`} />)}</div></div></section>;
}
function formatRuntime(seconds: number): string { if (!Number.isFinite(seconds)) return "--:--"; const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, "0")}`; }
