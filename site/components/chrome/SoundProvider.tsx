"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface SoundContextValue {
  muted: boolean;
  toggleMuted: () => void;
}

const SoundContext = createContext<SoundContextValue>({ muted: true, toggleMuted: () => {} });

/** Shared mute state for every autoplaying video site-wide — see the module doc below for why this exists. */
export function useSound(): SoundContextValue {
  return useContext(SoundContext);
}

// "wheel" removed on purpose — it doesn't reliably count as a strong-enough
// gesture for the browser to actually honor unmuting an already-playing
// video, even run synchronously inside the handler. The mutation didn't
// throw and didn't pause anything (that part's fixed), it just silently
// didn't take effect, which is exactly "have to toggle sound off/on myself
// before I hear anything" — a real click on the toggle IS unambiguously
// valid, so that always worked. pointerdown/touchstart/keydown are all
// unambiguously valid gestures for this specific browser permission.
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

/** Videos LazyVideo/Reels mark as sound-managed (excludes `forceMuted` ones like Campaigns' grid previews). */
const MANAGED_SELECTOR = "video[data-sound-managed='true']";

// Module-level, not React state — claimExclusiveSound runs from
// IntersectionObserver callbacks, which fire outside any component render
// and must read the *current* desired mute state synchronously, not
// whatever a React closure happened to capture when the effect was set up.
let currentlyMuted = true;

function applyMutedToDom(value: boolean) {
  currentlyMuted = value;
  document.querySelectorAll<HTMLVideoElement>(MANAGED_SELECTOR).forEach((v) => {
    v.muted = value;
  });
}

/**
 * Call this from a video's own "I just became the visible/active one"
 * moment (LazyVideo's and Reels' IntersectionObserver callbacks, on
 * entering view) — mutes every *other* sound-managed video immediately,
 * and explicitly (re-)asserts *this* video's own mute state against the
 * authoritative `currentlyMuted` value rather than trusting whatever its
 * `muted` prop happened to already be. That explicit reassertion is the
 * self-correcting part: if a video mounted before sound was unlocked and
 * somehow never picked up the change, becoming active fixes it on the spot
 * instead of silently staying wrong.
 *
 * Why this exists at all: the global mute toggle alone only answers "is
 * sound on or off," not "which of several simultaneously-playing videos
 * should be the one actually making noise." Two sections can legitimately
 * both be "playing" for a moment (e.g. mid-scroll, or if one's
 * pause-on-leave observer hasn't fired yet) — this is the explicit
 * tie-breaker: whichever video most recently became active wins,
 * unconditionally. Deliberately mutes rather than pauses the losers — they
 * keep looping silently rather than getting stuck paused with no trigger
 * to resume.
 */
export function claimExclusiveSound(video: HTMLVideoElement) {
  document.querySelectorAll<HTMLVideoElement>(MANAGED_SELECTOR).forEach((v) => {
    v.muted = v !== video ? true : currentlyMuted;
  });
}

/**
 * Sound is meant to be on by default, but autoplaying video *cannot*
 * literally start unmuted — Chrome/Safari/Firefox all block
 * autoplay-with-sound with zero prior user interaction. Start muted
 * (autoplay works reliably), auto-unmute on the visitor's first
 * scroll/click/tap/keypress.
 *
 * The bug this fixes: setting `muted` purely via React state and letting
 * it flow down as a prop looked right, but browsers only treat "unmute an
 * already-playing video" as a valid in-gesture action when it happens
 * *synchronously inside the actual trusted event's call stack*. React's
 * render is on a later tick — by the time `muted={false}` actually reaches
 * the DOM, the browser no longer associates it with the gesture, and
 * instead of unmuting, it just **pauses the video**. Nothing then ever
 * played it again, which is exactly "all videos stopped, no way to play
 * them" — except Campaigns' `forceMuted` videos, whose `muted` prop never
 * changes at all, so they never hit this path.
 *
 * Fix: mutate the DOM directly and synchronously first, *then* update
 * React state (for the toggle button's label and any video that mounts
 * later). The imperative write is what actually stays inside the gesture.
 */
export default function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(true);
  const unlockedRef = useRef(false);

  function setMuted(value: boolean) {
    applyMutedToDom(value);
    setMutedState(value);
  }

  useEffect(() => {
    function unlock() {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      setMuted(false);
      UNLOCK_EVENTS.forEach((evt) => window.removeEventListener(evt, unlock));
    }
    UNLOCK_EVENTS.forEach((evt) => window.addEventListener(evt, unlock, { passive: true }));
    return () => UNLOCK_EVENTS.forEach((evt) => window.removeEventListener(evt, unlock));
  }, []);

  const toggleMuted = () => setMuted(!muted);

  return <SoundContext.Provider value={{ muted, toggleMuted }}>{children}</SoundContext.Provider>;
}
