"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "motion/react";
import Link from "next/link";
import SectionHeader from "@/components/motion/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import RecTimer from "@/components/motion/RecTimer";
import ViewfinderFrame from "@/components/media/ViewfinderFrame";
import LazyVideo from "@/components/media/LazyVideo";
import PosterImage from "@/components/media/PosterImage";
import { gradientFor } from "@/lib/placeholders";
import type { MediaRef, WorkProject } from "@/lib/content";

const PLACEHOLDER_COUNT = 3;

function placeholderProjects(): WorkProject[] {
  return Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({
    slug: `placeholder-${i}`,
    order: i + 1,
    title: "Selected Work",
    client: "Client TBC",
    type: "Motion Design",
    year: "2026",
    role: "",
    category: "Untitled",
    annotation: "",
    ratio: "9:16" as const,
    cover: null,
    master: null,
    stills: [],
    brief: "",
    approach: "",
    system: "",
    result: "",
    stockPlaceholder: false,
  }));
}

/** Cover if it's an image; otherwise the video's own poster frame. Never a video src. */
function pickPoster(p: WorkProject): string | null {
  for (const ref of [p.cover, p.master] as (MediaRef | null)[]) {
    if (!ref) continue;
    if (ref.kind === "image") return ref.src;
    if (ref.poster) return ref.poster;
  }
  return null;
}

interface SlideProps {
  project: WorkProject;
  index: number;
  total: number;
  isActive: boolean;
  scrollYProgress: MotionValue<number>;
}

/**
 * One full-bleed panel in the pinned stack. Slides up from below (y:100%→0%),
 * *holds still* once fully in place, then recedes (scale/brightness down)
 * only once the next slide actually starts covering it — the Apple/Webflow
 * "each scroll brings up a new panel" stack.
 *
 * Every slide's lifecycle is explicitly ENTER → DWELL → (RECEDE, which is
 * literally the next slide's own ENTER window). Track is divided into
 * `2*total - 1` equal segments — a dwell segment for every slide (including
 * one at the very start for slide 0 and one at the very end for the last
 * slide) interleaved with an enter segment for every slide after the first:
 *
 *   dwell₀ | enter₁ | dwell₁ | enter₂ | dwell₂ | ... | enterₙ | dwellₙ
 *
 * The earlier version skipped straight from "enter ends" to "recede begins"
 * with no segment between them, so the *next* slide's entrance was already
 * underway the instant this one finished arriving — there was never a
 * moment where a fully-revealed slide just sat still. Explicit dwell
 * segments are what was missing, not more scroll height in general.
 */
function Slide({ project, index, total, isActive, scrollYProgress }: SlideProps) {
  const segments = 2 * total - 1; // one dwell per slide + one enter per slide-after-the-first
  const unit = 1 / segments;
  const isLast = index === total - 1;

  // Enter segment index (1st, 3rd, 5th, ... in the sequence above) = 2*index - 1.
  const enterStart = index === 0 ? -1 : (2 * index - 1) * unit;
  const enterEnd = index === 0 ? 0 : 2 * index * unit;
  // Recede window = the *next* slide's own enter segment — this slide only
  // starts dimming/shrinking once the next one is actually arriving, never sooner.
  const recedeStart = isLast ? 2 : (2 * (index + 1) - 1) * unit;
  const recedeEnd = isLast ? 3 : 2 * (index + 1) * unit;

  const y = useTransform(scrollYProgress, [enterStart, enterEnd], ["100%", "0%"]);
  const scale = useTransform(scrollYProgress, [recedeStart, recedeEnd], [1, 0.94]);
  const brightness = useTransform(scrollYProgress, [recedeStart, recedeEnd], [1, 0.55]);
  const filter = useTransform(brightness, (b) => `brightness(${b})`);

  const media = project.master ?? project.cover;
  const poster = pickPoster(project);
  const isPlaceholder = project.slug.startsWith("placeholder-");
  const num = String(index + 1).padStart(2, "0");
  const isVertical = project.ratio === "9:16";

  return (
    <motion.div style={{ y, scale, filter, zIndex: index + 1 }} className="absolute inset-0 will-change-transform">
      <div className="relative h-full w-full overflow-hidden bg-surface">
        {isVertical ? (
          <>
            {/* Blurred, zoomed, darkened backdrop — always a still poster, never a
                second video decode, so covered/off-screen slides cost nothing. */}
            <div className="absolute inset-0 scale-125 blur-2xl">
              {poster ? (
                <PosterImage src={poster} alt="" className="h-full w-full" gradient={gradientFor(index)} />
              ) : (
                <div className="h-full w-full" style={{ background: gradientFor(index) }} />
              )}
            </div>
            <div className="absolute inset-0 bg-bg/50" />

            {/* Foreground 9:16 frame — only the active slide actually decodes video. */}
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
              <div className="relative h-full max-h-[80vh] aspect-[9/16] overflow-hidden rounded-2xl border-2 border-text-hi/70 bg-bg shadow-none">
                {isActive && media?.kind === "video" ? (
                  <LazyVideo src={media.src} poster={media.poster ?? poster} className="h-full w-full" gradient={gradientFor(index)} />
                ) : poster ? (
                  <PosterImage src={poster} alt={project.title} className="h-full w-full" gradient={gradientFor(index)} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center" style={{ background: gradientFor(index) }}>
                    {process.env.NODE_ENV === "development" && (
                      <span className="tnum text-ui-sm text-meta">
                        PLACEHOLDER &middot; 03-selected-work/{num}-*
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : media ? (
          media.kind === "video" ? (
            isActive ? (
              <LazyVideo src={media.src} poster={media.poster} className="h-full w-full" gradient={gradientFor(index)} />
            ) : (
              <PosterImage src={media.poster ?? poster} alt={project.title} className="h-full w-full" gradient={gradientFor(index)} />
            )
          ) : (
            <PosterImage src={media.src} alt={project.title} className="h-full w-full" gradient={gradientFor(index)} />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: gradientFor(index) }}>
            {process.env.NODE_ENV === "development" && (
              <span className="tnum text-ui-sm text-meta">PLACEHOLDER &middot; 03-selected-work/{num}-*</span>
            )}
          </div>
        )}

        <ViewfinderFrame />
        <div className="absolute left-4 top-24 sm:left-10 sm:top-28">
          <RecTimer />
        </div>
        <span className="tnum absolute right-4 top-24 text-ui-sm text-meta sm:right-10 sm:top-28">{project.ratio}</span>

        {project.stockPlaceholder && process.env.NODE_ENV === "development" && (
          <span className="absolute bottom-28 left-4 rounded-full bg-bg/80 px-2 py-1 text-[10px] uppercase tracking-tight text-rec sm:left-10">
            Stock placeholder
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent p-6 sm:p-10">
          <span className="tnum text-ui-sm text-meta">({num}) &mdash; Selected Work</span>
          <h3 className="mt-2 text-sub-3 tracking-tight text-text-hi sm:text-sub-1">{project.title}</h3>
          <p className="mt-2 text-ui text-text-alt sm:text-body">
            {project.client} &middot; {project.type} &middot; {project.year}
          </p>
          {!isPlaceholder && (
            <Link
              href={`/work/${project.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-ui-sm uppercase text-meta transition-colors hover:text-rec"
            >
              View case study &rarr;
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SelectedWork({ projects: real }: { projects: WorkProject[] }) {
  const projects = real.length > 0 ? real : placeholderProjects();
  const total = projects.length;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const [activeIndex, setActiveIndex] = useState(0);

  const segments = 2 * total - 1;

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Same segment numbering as Slide's own windows (see its comment): the
    // incoming slide becomes "active" (decodes video) the moment its own
    // enter segment begins, not once fully arrived.
    const k = Math.min(segments - 1, Math.max(0, Math.floor(v * segments)));
    const idx = Math.min(total - 1, Math.ceil(k / 2));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  return (
    // Track height = one generous segment per dwell/enter pair (see Slide's
    // comment for the segment breakdown) — this is what actually gives every
    // slide, not just the last, a real settled moment before the next one starts.
    <section id="selected-work" ref={ref} className="relative" style={{ height: `${segments * 90}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute left-6 top-6 z-20 max-w-lg sm:left-10 sm:top-8">
          <SectionHeader number="03" title="Selected Work" />
          <Reveal className="mt-2 text-body text-text-alt">A private archive of motion, built frame by frame.</Reveal>
        </div>

        {projects.map((p, i) => (
          <Slide
            key={p.slug}
            project={p}
            index={i}
            total={total}
            isActive={i === activeIndex}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
