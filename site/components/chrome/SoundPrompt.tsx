"use client";

import { useSound } from "./SoundProvider";

/**
 * A real, directly-clickable button — not a passive banner betting on the
 * click "passing through" to some other listener underneath. That earlier
 * version relied on pointer-events-none plus a window-level listener
 * catching whatever was clicked; anything in the chain (Lenis's touch
 * handling, an unrelated stopPropagation, iOS Safari's pass-through click
 * quirks) could silently eat it with no way to tell from outside. This
 * button calls toggleMuted directly in its own onClick, the exact same
 * path FrameHUD's toggle already uses reliably — zero ambiguity, first
 * tap always works.
 */
export default function SoundPrompt() {
  const { muted, toggleMuted } = useSound();

  if (!muted) return null;

  return (
    <button
      onClick={toggleMuted}
      className="fixed left-1/2 top-6 z-50 -translate-x-1/2 animate-pulse rounded-full bg-bg/80 px-4 py-2 text-ui-sm text-text-hi backdrop-blur-[2px]"
    >
      {"\u{1F508}"} Tap for sound
    </button>
  );
}
