import Link from "next/link";
import type { Metadata } from "next";
import { getSelectedWork } from "@/lib/content";
import PosterImage from "@/components/media/PosterImage";
import Reveal from "@/components/motion/Reveal";
import BookingCTA from "@/components/sections/BookingCTA";
import Footer from "@/components/sections/Footer";
import { gradientFor } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Work — HaithamMotion" };

export default function WorkIndex() {
  const projects = getSelectedWork();

  return (
    <main className="pt-32">
      <div className="px-6 sm:px-10">
        <Reveal>
          <h1 className="text-sub-1 tracking-tight text-text-hi">Work</h1>
        </Reveal>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-16 px-6 sm:grid-cols-2 sm:px-10">
        {projects.length === 0 && (
          <p className="text-body text-text-alt">Case studies are on the way — check back soon.</p>
        )}
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.05}>
            <Link href={`/work/${p.slug}`} className="group block">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-text-alt/10">
                <PosterImage
                  src={p.cover?.src ?? null}
                  alt={p.title}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                  gradient={gradientFor(i)}
                />
                {p.stockPlaceholder && process.env.NODE_ENV === "development" && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-bg/80 px-2 py-1 text-[10px] uppercase tracking-tight text-rec">
                    Stock placeholder
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h2 className="text-sub-4 tracking-tight text-text-hi">{p.title}</h2>
                <span className="tnum text-ui-sm text-meta">{p.year}</span>
              </div>
              <p className="text-ui text-text-alt">
                {p.client} &middot; {p.type}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-24">
        <BookingCTA />
        <Footer />
      </div>
    </main>
  );
}
