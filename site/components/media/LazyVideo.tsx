"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

interface LazyVideoProps {
  src: string;
  poster?: string | null;
  className?: string;
  ratio?: "16:9" | "9:16" | "1:1";
  gradient?: string;
}

/**
 * IntersectionObserver-gated video. `preload="none"` (no bytes fetched)
 * until ~200px from viewport; plays only while actually intersecting and
 * pauses off-screen. More than ~2 simultaneously decoding videos tanks
 * frame rate (PLAN.md §5.2 #9) — this is the guard that prevents it.
 * No poster supplied → `#t=0.1` seeks to a first-frame fallback instead
 * of showing a blank box once loaded.
 */
export default function LazyVideo({ src, poster, className = "", ratio = "16:9", gradient }: LazyVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearView, setNearView] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNearView(true), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const reduced = prefersReducedMotion();
    if (!video || !nearView || reduced) return; // reduced motion: poster + manual controls only, no autoplay
    const playIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.1 },
    );
    playIO.observe(video);
    return () => playIO.disconnect();
  }, [nearView]);

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
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop={!reduced}
          controls={reduced}
          playsInline
          preload="metadata"
          poster={poster ?? undefined}
          src={effectiveSrc}
          onLoadedData={() => setReady(true)}
        />
      )}
    </div>
  );
}
