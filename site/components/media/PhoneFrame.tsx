import type { ReactNode } from "react";

/** iPhone chrome for the Reels device flow — preserve the designed 9:19.5 frame. */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[270px] max-w-full shrink-0 rounded-[2.75rem] border-[6px] border-[#1c1c1c] bg-black sm:w-[300px]">
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1c1c1c]" />
      <div className="aspect-[9/19.5] overflow-hidden rounded-[2.25rem]">{children}</div>
    </div>
  );
}
