"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import SectionHeader from "@/components/motion/SectionHeader";
import SplitText from "@/components/motion/SplitText";
import PhoneFrame from "@/components/media/PhoneFrame";
import { claimExclusiveSound, restoreSoundOnNextGesture } from "@/components/chrome/SoundProvider";
import { gradientFor } from "@/lib/placeholders";
import { ease, prefersReducedMotion } from "@/lib/motion";
import type { ReelItem } from "@/lib/content";

const swipeVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function Reels({ reels }: { reels: ReelItem[] }) {
  const items: ReelItem[] = reels.length > 0
    ? reels
    : [{ slug: "placeholder", order: 1, title: "Reel", event: "", year: "", description: "", src: "", poster: null }];
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef(0);
  // AnimatePresence keeps the outgoing slide's <video> mounted for the
  // whole 0.45s exit transition, so it unmounts ~450ms *after* the
  // incoming slide's video has already attached. A single `ref={setVideoNode}`
  // shared across every slide meant that late unmount called setVideoNode(null)
  // and stomped the already-current video's node — this map lets a video's
  // own detach only clear state if it's still the node state points at.
  const videoMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const videoRefCallbacksRef = useRef<Map<string, (node: HTMLVideoElement | null) => void>>(new Map());
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  const [stageVisible, setStageVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [runtime, setRuntime] = useState("--:--");
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  function getVideoRef(slug: string) {
    let callback = videoRefCallbacksRef.current.get(slug);
    if (!callback) {
      callback = (node) => {
        if (node) {
          videoMapRef.current.set(slug, node);
          setVideoNode(node);
        } else {
          const existing = videoMapRef.current.get(slug);
          videoMapRef.current.delete(slug);
          existing?.pause();
          setVideoNode((prev) => (prev === existing ? null : prev));
        }
      };
      videoRefCallbacksRef.current.set(slug, callback);
    }
    return callback;
  }

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end start"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const index = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)));
    if (index !== prevActiveRef.current) {
      setDir(index > prevActiveRef.current ? 1 : -1);
      prevActiveRef.current = index;
      setActive(index);
    }
  });

  const current = items[active];
  const hasMedia = Boolean(current.src);

  // Observe the stable pinned stage, not the transformed video. The video is
  // animated inside this stage; observing the video itself made its enter/exit
  // transform look like it had left the viewport and paused it mid-transition.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStageVisible(entry.isIntersecting && entry.intersectionRatio > 0.15),
      { threshold: [0, 0.15, 0.5, 1] },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Muted-first, same as LazyVideo: autoplay-with-sound is never permitted
  // without a prior gesture. Shared by both the effect-driven autoplay and
  // the tap-to-play button so neither path can leave a reel stuck paused.
  function attemptPlay(video: HTMLVideoElement | null) {
    if (!video || !hasMedia || reduced || document.hidden) return;
    video.muted = true;
    video.play().then(() => {
      claimExclusiveSound(video);
      if (video.paused) {
        video.muted = true;
        video.play().catch(() => {});
        restoreSoundOnNextGesture(video);
      }
    }).catch(() => setPlaying(false));
  }

  /** Autoplay path — gated on the pinned stage actually being visible. */
  function playVideo(video: HTMLVideoElement | null = videoNode) {
    if (!stageVisible) return;
    attemptPlay(video);
  }

  /** Tap-to-play path — a real gesture must never be swallowed by a stale
   *  IntersectionObserver reading, so this skips the stageVisible gate. */
  function forcePlay(video: HTMLVideoElement | null = videoNode) {
    attemptPlay(video);
  }

  // One playback owner for the active reel: plays while the pinned stage is
  // visible, pauses the moment it isn't (leaving for Campaigns included).
  // `muted` is deliberately not a dependency here — toggling sound must
  // never pause and restart the reel; SoundProvider's own DOM write already
  // keeps every sound-managed video's mute state in sync on toggle.
  useEffect(() => {
    const video = videoNode;
    if (!video || !hasMedia || reduced) return;

    if (stageVisible) playVideo(video);
    else video.pause();

    return () => {
      video.pause();
    };
  }, [videoNode, active, hasMedia, reduced, stageVisible]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoNode?.pause();
      else playVideo();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [videoNode, stageVisible, reduced, hasMedia]);

  useEffect(() => {
    setRuntime("--:--");
    if (videoNode && videoNode.readyState >= 1) setRuntime(formatRuntime(videoNode.duration));
  }, [active, videoNode]);

  const trackVh = (Math.max(items.length, 2) + 0.5) * 160;
  const phoneSizing = "!w-[clamp(210px,calc(46.15dvh-6.9rem),300px)]";

  return (
    <section id="reels" className="relative" style={{ height: `${trackVh}vh` }}>
      <div ref={trackRef} className="absolute inset-0" />
      <div ref={stageRef} className="sticky top-0 flex h-screen flex-col items-center overflow-hidden px-6 pt-6 pb-8 sm:px-10">
        <SectionHeader number="04" title="Reels" className="w-full shrink-0 self-start" />
        <h2 className="mt-4 w-full shrink-0 self-start text-sub-4 tracking-tight text-text-hi">
          <SplitText as="span" splitBy="word">Short</SplitText>{" "}
          <span className="text-text-alt/60">/</span>{" "}
          <SplitText as="span" splitBy="word" delay={0.1}>Form</SplitText>
        </h2>

        <div className="grid min-h-0 w-full flex-1 grid-cols-1 content-center items-center gap-4 lg:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)] lg:gap-10">
          <AnimatePresence mode="wait">
            <motion.div key={`${current.slug}-event`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-[10rem] justify-self-center text-center lg:w-full lg:max-w-none lg:justify-self-end lg:text-right">
              {current.event && <p className="text-ui-sm uppercase tracking-tight text-meta">{current.event}</p>}
              <p className="mt-1 text-ui text-text-alt">Mobile View</p>
            </motion.div>
          </AnimatePresence>

          <PhoneFrame className={phoneSizing}>
            <div className="relative h-full w-full overflow-hidden bg-surface">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div key={current.slug} custom={dir} variants={reduced ? undefined : swipeVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: ease.out }} className="absolute inset-0" style={{ background: hasMedia ? undefined : gradientFor(active) }}>
                  {hasMedia && <video ref={getVideoRef(current.slug)} data-sound-managed="true" className="h-full w-full object-cover" src={current.poster ? current.src : `${current.src}#t=0.1`} poster={current.poster ?? undefined} muted loop={!reduced} autoPlay={false} controls={reduced} playsInline preload="auto" onLoadedMetadata={(event) => setRuntime(formatRuntime(event.currentTarget.duration))} onCanPlay={(event) => playVideo(event.currentTarget)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
                  {hasMedia && !playing && !reduced && <button type="button" aria-label="Play reel" className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-text-hi/70 bg-bg/70 text-2xl text-text-hi backdrop-blur-sm" onClick={() => forcePlay()}><span aria-hidden className="translate-x-0.5">▶</span></button>}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-ui-sm text-text-hi"><p className="tnum text-meta">EDITOR · COLOURIST &nbsp; RUNTIME {runtime} &nbsp; RATIO 9:16</p><p className="mt-1">@haithammotion · {current.title}</p></div>
                </motion.div>
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-6 pt-4 text-ui-sm text-text-hi"><span className="border-b border-text-hi pb-1">Reels</span><span className="text-text-alt/60">Friends</span></div>
            </div>
          </PhoneFrame>

          <AnimatePresence mode="wait">
            <motion.div key={`${current.slug}-desc`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-[10rem] justify-self-center text-center lg:w-full lg:max-w-none lg:justify-self-start lg:text-left">
              {current.description && <p className="text-ui text-text-alt">{current.description}</p>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex shrink-0 gap-1.5">{items.map((item, index) => <span key={item.slug} className={`h-1 w-6 rounded-full transition-colors ${index === active ? "bg-rec" : "bg-text-alt/20"}`} />)}</div>
      </div>
    </section>
  );
}

function formatRuntime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
