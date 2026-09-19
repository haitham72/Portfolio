"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useSound, claimExclusiveSound, restoreSoundOnNextGesture } from "@/components/chrome/SoundProvider";

interface LazyVideoProps {
  src: string;
  poster?: string | null;
  className?: string;
  ratio?: "16:9" | "9:16" | "1:1";
  gradient?: string;
  forceMuted?: boolean;
}

/** Visibility-gated video with a play-only fallback; no pause overlay is shown. */
export default function LazyVideo({ src, poster, className = "", ratio = "16:9", gradient, forceMuted = false }: LazyVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearView, setNearView] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { muted: soundMuted } = useSound();
  const muted = forceMuted || soundMuted;

  useEffect(() => setReduced(prefersReducedMotion()), []);

  // Muted-first: autoplay-with-sound is never permitted without a prior
  // gesture, so playback always starts muted, then claims sound afterward.
  // If the browser punishes that follow-up unmute by pausing the video,
  // playback wins — force it back to muted and playing, and defer sound to
  // the visitor's next real tap rather than leaving it stalled.
  function tryPlay() {
    const video = videoRef.current;
    if (!video || reduced || document.hidden) return;
    video.muted = true;
    video.play().then(() => {
      if (forceMuted) return;
      claimExclusiveSound(video);
      if (video.paused) {
        video.muted = true;
        video.play().catch(() => {});
        restoreSoundOnNextGesture(video);
      }
    }).catch(() => setPlaying(false));
  }

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearView(true);
        tryPlay();
      } else {
        videoRef.current?.pause();
        setPlaying(false);
      }
    }, { rootMargin: "200px 0px", threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced, muted, forceMuted]);

  useEffect(() => { if (nearView) tryPlay(); }, [nearView, reduced, muted, forceMuted]);

  useEffect(() => {
    const onVisibility = () => document.hidden ? videoRef.current?.pause() : tryPlay();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [nearView, reduced, muted, forceMuted]);

  const effectiveSrc = poster ? src : `${src}#t=0.1`;
  const aspectClass = ratio === "9:16" ? "aspect-[9/16]" : ratio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${aspectClass} ${className}`} style={!poster && !ready ? { background: gradient } : undefined}>
      {nearView && (
        <video
          ref={videoRef}
          data-sound-managed={forceMuted ? undefined : "true"}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          autoPlay={!reduced}
          loop={!reduced}
          controls={reduced}
          playsInline
          preload="auto"
          poster={poster ?? undefined}
          src={effectiveSrc}
          onLoadedData={() => { setReady(true); tryPlay(); }}
          onCanPlay={tryPlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}
      {nearView && !playing && !reduced && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Play video"
          className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-text-hi/70 bg-bg/70 text-2xl text-text-hi backdrop-blur-sm"
          onClick={(event) => { event.stopPropagation(); tryPlay(); }}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); tryPlay(); } }}
        >
          <span aria-hidden className="translate-x-0.5">▶</span>
        </span>
      )}
    </div>
  );
}
