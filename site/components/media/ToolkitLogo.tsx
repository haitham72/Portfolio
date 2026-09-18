"use client";

import { useState } from "react";

const ICON_COLOR = "E3DCCB"; // text-alt, no leading # — cdn.simpleicons.org's color-suffix format

interface ToolkitLogoProps {
  name: string;
  slug: string | null; // verified cdn.simpleicons.org slug, or null if that brand isn't on Simple Icons
  initials: string; // fallback badge text — the primary path for ~half this list (Adobe apps, most AI tools)
}

/** One toolkit entry — real brand SVG via Simple Icons, or an initials badge when the brand isn't listed there. 1.5x the original icon size (42px). */
export default function ToolkitLogo({ name, slug, initials }: ToolkitLogoProps) {
  const [failed, setFailed] = useState(false);
  const showIcon = slug && !failed;

  return (
    <div className="flex shrink-0 flex-col items-center gap-2.5 px-8" title={name}>
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element -- external SVG from a CDN, not a local/optimizable asset
        <img
          src={`https://cdn.simpleicons.org/${slug}/${ICON_COLOR}`}
          alt={name}
          width={42}
          height={42}
          className="h-[42px] w-[42px] opacity-70 transition-opacity duration-200"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-text-alt/30 text-xs uppercase tracking-tight text-text-alt/80">
          {initials}
        </div>
      )}
      <span className="whitespace-nowrap text-ui-sm text-meta">{name}</span>
    </div>
  );
}
