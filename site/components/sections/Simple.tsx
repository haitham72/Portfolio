"use client";

import { useState } from "react";
import LazyVideo from "@/components/media/LazyVideo";
import PosterImage from "@/components/media/PosterImage";
import { gradientFor, SITE } from "@/lib/placeholders";
import type { SimpleItem } from "@/lib/content";

/**
 * An Instagram-post-grid gallery — one big "post" up top (profile-row +
 * square media + action-icon row, same visual language as an IG post
 * card), a grid of smaller square posts below. Clicking a grid item
 * replaces what plays in the featured post above, in place — no modal,
 * deliberately simpler than Campaigns' Lightbox-based interaction.
 */
export default function Simple({ items }: { items: SimpleItem[] }) {
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;
  const current = items[active];

  return (
    <section id="simple" className="px-6 py-16 sm:px-10">
      <div className="mb-8 flex items-center gap-2 text-ui-sm uppercase tracking-tight text-meta">
        <span>Simple</span>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-text-alt/10 bg-surface">
          <div className="flex items-center gap-4 border-b border-text-alt/10 p-5">
            <div className="h-14 w-14 shrink-0 rounded-full bg-text-alt/20" />
            <span className="text-body text-text-hi">{SITE.brand.toLowerCase()}</span>
          </div>

          <div className="relative aspect-square">
            <LazyVideo
              key={current.slug}
              src={current.src}
              poster={current.poster}
              ratio="1:1"
              className="h-full w-full"
              gradient={gradientFor(active)}
            />
          </div>

          <div className="flex items-center gap-6 p-5 text-3xl text-text-hi">
            <span aria-hidden>&#9825;</span>
            <span aria-hidden>&#9998;</span>
            <span aria-hidden>&#8635;</span>
            <span className="ml-auto text-body text-meta">{current.title}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <button
              key={item.slug}
              onClick={() => setActive(i)}
              aria-current={i === active}
              aria-label={`Show ${item.title}`}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? "border-rec" : "border-transparent hover:border-text-alt/30"
              }`}
            >
              <PosterImage src={item.poster} alt={item.title} className="h-full w-full" gradient={gradientFor(i)} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
