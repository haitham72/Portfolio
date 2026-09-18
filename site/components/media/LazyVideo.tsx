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

export default function LazyVideo({ src, poster, className = "", ratio = "16:9", gradient, forceMuted = false }: LazyVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearView, setNearView] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { muted: soundMuted } = useSound();
  const muted = forceMuted || soundMuted;

  useEffect(() => setReduced(prefersReducedMotion()), []);

  const tryPlay = () => {
    const video = videoRef.current;
    if (!video || reduced || document.hidden) return;
    video.muted = muted;
    if (!forceMuted) claimExclusiveSound(video);
    video.play().catch(() => {});
  };

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearView(true);
        // The video may not exist until the state update commits. The effect
        // below and the media readiness handlers cover that second tick.
        tryPlay();
      } else {
        videoRef.current?.pause();
      }
    }, { rootMargin: "200px 0px", threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced, muted, forceMuted]);

  useEffect(() => {
    if (nearView) tryPlay();
  }, [nearView, reduced, muted, forceMuted]);

  useEffect(() => {
    const onVisibility = () => document.hidden ? videoRef.current?.pause() : tryPlay();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [nearView, reduced, muted, forceMuted]);

  const effectiveSrc = poster ? src : `${src}#t=0.1`;
  const aspectClass = ratio === "9:16" ? "aspect-[9/16]" : ratio === "1:1" ? "aspect-square" : "aspect-video";

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${aspectClass} ${className}`} style={!poster && !ready ? { background: gradient } : undefined}>
      {nearView && <video ref={videoRef} data-sound-managed={forceMuted ? undefined : "true"} className="absolute inset-0 h-full w-full object-cover" muted={muted} autoPlay={!reduced} loop={!reduced} controls={reduced} playsInline preload="auto" poster={poster ?? undefined} src={effectiveSrc} onLoadedData={() => { setReady(true); tryPlay(); }} onCanPlay={tryPlay} />}
    </div>
  );
}
