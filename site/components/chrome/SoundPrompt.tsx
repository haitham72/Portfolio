"use client";

import { useSound } from "./SoundProvider";

/**
 * Browsers refuse to autoplay video with sound until the visitor has
 * interacted with the page at all — no code workaround exists, and
 * SoundProvider already auto-unlocks on the very first click/tap/keypress
 * anywhere on the page. The gap: a visitor who only scrolls (mouse wheel
 * doesn't count as a valid gesture for this, unlike click/tap/key — see
 * SoundProvider's comment) never triggers that unlock and never notices
 * FrameHUD's small toggle either, so sound just silently never turns on.
 *
 * This is the fix: an unmissable, self-dismissing prompt. `pointer-events-none`
 * so it never intercepts the click itself — that click lands on whatever's
 * underneath and reaches SoundProvider's window-level listener exactly as
 * if the prompt weren't there. It disappears the instant `muted` flips to
 * false, from any gesture anywhere, not just one aimed at this element.
 */
export default function SoundPrompt() {
  const { muted } = useSound();

  if (!muted) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 animate-pulse rounded-full bg-bg/80 px-4 py-2 text-ui-sm text-text-hi backdrop-blur-[2px]"
      role="status"
    >
      {"\u{1F508}"} Tap or press any key for sound
    </div>
  );
}
