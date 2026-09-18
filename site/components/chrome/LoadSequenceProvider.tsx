"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { hasPlayedLoadSequence, markLoadSequencePlayed } from "@/lib/motion";

const LoadSequenceContext = createContext(false); // context value = "skip the entrance cascade"

/** true = this element should skip straight to its resting state, no entrance transition. */
export function useSkipLoadSequence(): boolean {
  return useContext(LoadSequenceContext);
}

/**
 * Gates the homepage's page-load cascade (PLAN.md §5.0 / §5.1-D) to once
 * per session. Server render and first client paint both assume "play"
 * (deterministic — no sessionStorage read during render, so no hydration
 * mismatch); useLayoutEffect corrects to "skip" synchronously before the
 * browser paints if this session already played it, so a back-navigation
 * to "/" snaps straight to rest instead of flashing the animation again.
 */
export default function LoadSequenceProvider({ children }: { children: ReactNode }) {
  const [skip, setSkip] = useState(false);

  useLayoutEffect(() => {
    if (hasPlayedLoadSequence()) {
      setSkip(true);
    } else {
      markLoadSequencePlayed();
    }
  }, []);

  return <LoadSequenceContext.Provider value={skip}>{children}</LoadSequenceContext.Provider>;
}
