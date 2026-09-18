// Motion tokens — verified against anamorph.framer.website's own
// __framer__appearAnimationsContent keyframe data (see PLAN.md §5.0).
// Do not invent new easings or durations. Everything imports from here.

export const ease = { out: [0.16, 1, 0.3, 1] } as const; // the only curve, all 22 reference elements use it

export const dur = {
  chrome: 0.6, // HUD, labels, small UI
  base: 1.4, // standard block reveal
  slab: 1.5, // large y:±860 panel reveals
  hero: 2.4, // hero scale-settle + wordmark
} as const;

export const stagger = { char: 0.018, item: 0.25 } as const; // 0.25 = reference load-cascade cadence

// The reference site used a subtle 6% settle; bumped on request so the
// hero's parallax settle actually reads on load instead of being nearly invisible.
export const zoom = { in: 1.22, rest: 1, out: 0.94 } as const;

// Springs ONLY for pointer interaction — never for scroll/load reveals.
export const spring = {
  snap: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
} as const;

// Page-load cascade delays (seconds) — 22 elements, ~0.25s apart, longest first.
export const loadCascade = [
  0, 0.25, 0.45, 0.65, 0.9, 1.15, 1.4, 1.65, 1.9, 2.15, 2.4, 2.65, 2.9, 3.15,
] as const;

export const LOAD_SEQUENCE_TOTAL = 3.75; // seconds, first paint only

// Standard viewport trigger for scroll-triggered (non-pinned) reveals.
// Vertical-only shrink (top/right/bottom/left) — a horizontal shrink would
// permanently exclude characters/elements sitting close to the left edge
// (e.g. a headline at inset-x-6) since there's no horizontal scroll to ever
// bring them into a horizontally-shrunk root. That was cutting the first
// few characters off every headline (SplitText's whileInView never fired
// for them) — this is the fix.
export const viewportOnce = { once: true, margin: "-15% 0px -15% 0px" } as const;

// sessionStorage flag so the load cascade only ever plays once per session.
export const LOAD_FLAG_KEY = "hm-load-played";

export function hasPlayedLoadSequence(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(LOAD_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLoadSequencePlayed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LOAD_FLAG_KEY, "1");
  } catch {
    // storage unavailable (private mode) — fine, sequence just replays
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
