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
  forceMuted?: boolean;
}

/** Visibility-gated video primitive used by Hero, Selected Work, and Campaign previews. */
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
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearView(true);
        const video = videoRef.current;
        if (video && !reduced) {
          video.muted = muted;
          if (!forceMuted) claimExclusiveSound(video);
          video.play().catch(() => {});
        }
      } else {
        videoRef.current?.pause();
      }
    }, { rootMargin: "200px 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, muted, forceMuted]);

  // The observer can fire before setNearView has mounted the video. This
  // second effect is the required first-load path for Hero and Selected Work.
  useEffect(() => {
    const video = videoRef.current;
    if (!nearView || !video || reduced) return;
    video.muted = muted;
    if (!forceMuted) claimExclusiveSound(video);
    video.play().catch(() => {});
  }, [nearView, reduced, muted, forceMuted]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) videoRef.current?.pause();
      else if (nearView && !reduced) videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [nearView, reduced]);

  const effectiveSrc = poster ? src : `${src}#t=0.1`;
  const aspectClass = ratio === "9:16" ? "aspect-[9/16]" : ratio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${aspectClass} ${className}`} style={!poster && !ready ? { background: gradient } : undefined}>
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
