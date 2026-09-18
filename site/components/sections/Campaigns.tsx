"use client";

import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import LazyVideo from "@/components/media/LazyVideo";
import PosterImage from "@/components/media/PosterImage";
import Lightbox from "@/components/media/Lightbox";
import { gradientFor } from "@/lib/placeholders";
import type { CampaignEdition, CampaignGroup } from "@/lib/content";

/**
 * The grid preview here always stays muted (`forceMuted`), regardless of
 * the global sound toggle — several of these can be on screen/nearly
 * visible at once, and letting them all compete for audio (with each
 * other, and with the modal's own video once opened) is exactly the
 * "plays over everything" problem. The Lightbox modal below is the
 * opposite case on purpose: it's a single focused video the visitor
 * explicitly opened, so it plays with sound unconditionally (no `muted`
 * attribute at all) — clicking to open it is itself the user gesture
 * browsers require to allow that.
 */
function EditionCard({ edition, colorIndex }: { edition: CampaignEdition; colorIndex: number }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const slide = edition.media[active] ?? null;

  function step(delta: number) {
    setActive((i) => (i + delta + edition.media.length) % edition.media.length);
  }

  return (
    <div className="w-[220px] shrink-0 snap-start sm:w-[280px]">
      <button
        type="button"
        onClick={() => slide && setOpen(true)}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-text-alt/10 bg-surface text-left"
        aria-label={`Open ${edition.title}`}
      >
        {slide ? (
          slide.kind === "video" ? (
            <LazyVideo
              src={slide.src}
              poster={slide.poster}
              className="h-full w-full"
              gradient={gradientFor(colorIndex)}
              forceMuted
            />
          ) : (
            <PosterImage src={slide.src} alt={edition.title} className="h-full w-full" gradient={gradientFor(colorIndex)} />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center" style={{ background: gradientFor(colorIndex) }}>
            {process.env.NODE_ENV === "development" && <span className="tnum text-ui-sm text-meta">PLACEHOLDER</span>}
          </div>
        )}

        {edition.year && (
          <span className="tnum absolute left-3 top-3 rounded-full bg-bg/80 px-2 py-1 text-ui-sm text-text-hi">
            {edition.year}
          </span>
        )}
        {edition.stockPlaceholder && process.env.NODE_ENV === "development" && (
          <span className="absolute right-3 top-3 rounded-full bg-bg/80 px-2 py-1 text-[10px] uppercase tracking-tight text-rec">
            Stock
          </span>
        )}

        {edition.media.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {edition.media.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === active ? "bg-rec" : "bg-text-hi/40"}`} />
            ))}
          </div>
        )}
      </button>
      <div className="mt-3">
        <h4 className="text-body-lg text-text-hi">{edition.title}</h4>
        {edition.description && <p className="mt-1 text-ui text-text-alt">{edition.description}</p>}
      </div>

      <Lightbox open={open} onClose={() => setOpen(false)} onNext={() => step(1)} onPrev={() => step(-1)}>
        <div className="flex max-h-[85vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-surface sm:max-w-md">
          <div className="relative aspect-[4/5]">
            {slide?.kind === "video" ? (
              <video
                key={slide.src}
                src={slide.src}
                poster={slide.poster ?? undefined}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            ) : slide ? (
              <PosterImage src={slide.src} alt={edition.title} className="h-full w-full" gradient={gradientFor(colorIndex)} />
            ) : (
              <div className="h-full w-full" style={{ background: gradientFor(colorIndex) }} />
            )}
          </div>
          <div className="p-5">
            <h4 className="text-body-lg text-text-hi">{edition.title}</h4>
            {edition.description && <p className="mt-1 text-ui text-text-alt">{edition.description}</p>}
          </div>
        </div>
      </Lightbox>
    </div>
  );
}

function CampaignRow({ group, baseColor }: { group: CampaignGroup; baseColor: number }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-ui-sm uppercase tracking-tight text-meta">
        <span>{group.title}</span>
        <span aria-hidden>+</span>
      </div>
      <div className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-4">
        {group.editions.map((edition, i) => (
          <div key={edition.slug} className="flex shrink-0 items-center gap-3">
            {i > 0 && (
              <span aria-hidden className="hidden pb-24 text-xl text-text-alt/30 sm:block">
                &rarr;
              </span>
            )}
            <EditionCard edition={edition} colorIndex={baseColor + i} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Multiple campaign groups (New Year, Ramadan, ...), each showing its
 * editions as a connected year sequence — [2025] → [2024] → [2023] — per
 * your spec. A group with only one edition so far (Ramadan → 2026) just
 * renders that single card; more get appended left-to-right as you add
 * numbered year folders. Clicking a card opens an Instagram-post-style
 * modal (bigger media, title/description, prev/next through that edition's
 * own carousel). Hide-when-empty per group is handled upstream in
 * lib/content.ts (a group with zero editions never reaches this component).
 */
export default function Campaigns({ campaigns }: { campaigns: CampaignGroup[] }) {
  if (campaigns.length === 0) return null;

  return (
    <section id="campaigns" className="px-6 py-16 sm:px-10">
      <div className="mb-8 flex items-center gap-2 text-ui-sm uppercase tracking-tight text-meta">
        <span>Campaigns</span>
        <span aria-hidden>+</span>
      </div>
      <div className="flex flex-col gap-14">
        {campaigns.map((group, gi) => (
          <Reveal key={group.slug} delay={gi * 0.05}>
            <CampaignRow group={group} baseColor={gi * 3} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
