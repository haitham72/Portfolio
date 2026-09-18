"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useSound, claimExclusiveSound } from "@/components/chrome/SoundProvider";

interface LazyVideoProps {
  src: string;
  poster?: string | null;
  className?: string;
  ratio?: "16:9" | "9:16" | "1:1";
  gradient?: string;
  /** Ignore the global sound toggle and always stay muted — Campaigns' ambient grid previews use this so they never compete with each other or with the modal's audio. */
  forceMuted?: boolean;
}

/**
 * IntersectionObserver-gated video. `preload="none"` (no bytes fetched)
 * until ~200px from viewport; plays only while actually intersecting and
 * pauses off-screen. More than ~2 simultaneously decoding videos tanks
 * frame rate (PLAN.md §5.2 #9) — this is the guard that prevents it.
 * No poster supplied → `#t=0.1` seeks to a first-frame fallback instead
 * of showing a blank box once loaded. `muted` is read from SoundProvider's
 * shared context (unless `forceMuted`), not hardcoded — starts muted
 * (required for autoplay to work at all). `data-sound-managed="true"`
 * marks the element for SoundProvider's synchronous DOM-level unmute (see
 * that file's doc comment for why it can't just be a React prop update) —
 * omitted when `forceMuted`, so those never get touched by the global toggle.
 *
 * First play uses the native `autoPlay` attribute, not a manual `.play()`
 * call — Reels (`04Reels.tsx`) always used native `autoPlay` and never had
 * an autoplay-reliability problem; this component was the one hand-rolling
 * it via a JS `.play()` inside an IntersectionObserver callback, which is
 * exactly the less-reliable path (subject to promise rejection depending
 * on buffered data, timing, etc., silently swallowed by `.catch()`). The
 * observer's only job now is pausing when scrolled away and *resuming*
 * (a real use for manual `.play()`) when scrolled back into view after
 * that — autoplay itself is the browser's own problem to solve, and it's
 * better at it than a hand-rolled retry would be.
 *
 * `claimExclusiveSound` fires the moment this video becomes visible —
 * mutes every other sound-managed video immediately, so whichever section
 * you're actually looking at is always the only one making noise,
 * regardless of what any other section's own pause-on-leave timing did.
 */
export default function LazyVideo({ src, poster, className = "", ratio = "16:9", gradient, forceMuted = false }: LazyVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearView, setNearView] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { muted: soundMuted } = useSound();
  const muted = forceMuted || soundMuted;

  useEffect(() => setReduced(prefersReducedMotion()), []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearView(true);
          const v = videoRef.current;
          if (v) {
            if (!forceMuted) claimExclusiveSound(v); // becoming active — silence every other managed video now
            if (v.paused && !reduced) v.play().catch(() => {}); // resume after a prior scroll-away pause
          }
        } else {
          videoRef.current?.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, forceMuted]);

  const effectiveSrc = poster ? src : `${src}#t=0.1`;
  const aspectClass = ratio === "9:16" ? "aspect-[9/16]" : ratio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${aspectClass} ${className}`}
      style={!poster && !ready ? { background: gradient } : undefined}
    >
      {nearView && (
        <video
          ref={videoRef}
          data-sound-managed={forceMuted ? undefined : "true"}
          className="absolute inset-0 h-full w-full object-cover"
          muted={muted}
          autoPlay={!reduced}
          loop={!reduced}
          controls={reduced}
          playsInline
          preload="auto"
          poster={poster ?? undefined}
          src={effectiveSrc}
          onLoadedData={() => setReady(true)}
        />
      )}
    </div>
  );
}
