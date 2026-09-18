import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSelectedWork } from "@/lib/content";
import LazyVideo from "@/components/media/LazyVideo";
import PosterImage from "@/components/media/PosterImage";
import Reveal from "@/components/motion/Reveal";
import BookingCTA from "@/components/sections/BookingCTA";
import Footer from "@/components/sections/Footer";
import { gradientFor } from "@/lib/placeholders";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getSelectedWork().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getSelectedWork().find((p) => p.slug === slug);
  return { title: project ? `${project.title} — HaithamMotion` : "Work — HaithamMotion" };
}

const BLOCKS = [
  { key: "brief", label: "The Brief" },
  { key: "approach", label: "The Approach" },
  { key: "system", label: "The System" },
  { key: "result", label: "The Result" },
] as const;

export default async function WorkCaseStudy({ params }: PageProps) {
  const { slug } = await params;
  const projects = getSelectedWork();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const project = projects[index];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <main className="pt-32">
      <div className="px-6 sm:px-10">
        <Reveal>
          <h1 className="max-w-3xl text-sub-1 tracking-tight text-text-hi">{project.title}</h1>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 grid grid-cols-2 gap-6 text-ui text-text-alt sm:grid-cols-4">
          <div>
            <span className="block text-ui-sm text-meta">Client</span>
            {project.client}
          </div>
          <div>
            <span className="block text-ui-sm text-meta">Type</span>
            {project.type}
          </div>
          <div>
            <span className="block text-ui-sm text-meta">Year</span>
            {project.year}
          </div>
          <div>
            <span className="block text-ui-sm text-meta">Role</span>
            {project.role}
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="relative mt-12 overflow-hidden sm:mx-10 sm:rounded-2xl">
        {project.ratio === "9:16" ? (
          <div className="relative aspect-video">
            {/* Blurred zoomed backdrop, still image only — no second video decode. */}
            <div className="absolute inset-0 scale-125 blur-2xl">
              <PosterImage
                src={project.master?.kind === "image" ? project.master.src : (project.master?.poster ?? project.cover?.src ?? null)}
                alt=""
                className="h-full w-full"
                gradient={gradientFor(index)}
              />
            </div>
            <div className="absolute inset-0 bg-bg/50" />
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
              <div className="relative h-full max-h-[70vh] aspect-[9/16] overflow-hidden rounded-2xl border-2 border-text-hi/70 bg-bg">
                {project.master ? (
                  project.master.kind === "video" ? (
                    <LazyVideo src={project.master.src} poster={project.master.poster} className="h-full w-full" gradient={gradientFor(index)} />
                  ) : (
                    <PosterImage src={project.master.src} alt={project.title} className="h-full w-full" gradient={gradientFor(index)} />
                  )
                ) : (
                  <div className="h-full w-full" style={{ background: gradientFor(index) }} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video">
            {project.master ? (
              project.master.kind === "video" ? (
                <LazyVideo src={project.master.src} poster={project.master.poster} className="h-full w-full" gradient={gradientFor(index)} />
              ) : (
                <PosterImage src={project.master.src} alt={project.title} className="h-full w-full" gradient={gradientFor(index)} />
              )
            ) : (
              <div className="h-full w-full" style={{ background: gradientFor(index) }} />
            )}
          </div>
        )}
        {project.stockPlaceholder && process.env.NODE_ENV === "development" && (
          <span className="absolute bottom-4 left-4 rounded-full bg-bg/80 px-2 py-1 text-[10px] uppercase tracking-tight text-rec sm:left-6">
            Stock placeholder — free stock media + filler copy, not real work
          </span>
        )}
      </Reveal>

      <div className="mx-auto mt-20 flex max-w-2xl flex-col gap-16 px-6 sm:px-10">
        {BLOCKS.map((block) => {
          const text = project[block.key];
          if (!text) return null;
          return (
            <Reveal key={block.key}>
              <span className="tnum text-ui-sm text-meta">{block.label}</span>
              <p className="mt-3 text-body-lg text-text-alt">{text}</p>
            </Reveal>
          );
        })}
      </div>

      {project.stills.length > 0 && (
        <div className="mt-20 grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 sm:px-10">
          {project.stills.map((src) => (
            <div key={src} className="aspect-video overflow-hidden rounded-xl border border-text-alt/10">
              <PosterImage src={src} alt="" className="h-full w-full" />
            </div>
          ))}
        </div>
      )}

      {projects.length > 1 && (
        <div className="mt-24 flex items-center justify-between border-y border-text-alt/10 px-6 py-8 text-ui text-text-alt sm:px-10">
          <Link href={`/work/${prev.slug}`} className="hover:text-text-hi">
            &larr; {prev.title}
          </Link>
          <Link href={`/work/${next.slug}`} className="hover:text-text-hi">
            {next.title} &rarr;
          </Link>
        </div>
      )}

      <BookingCTA />
      <Footer />
    </main>
  );
}
