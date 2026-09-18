import Reveal from "@/components/motion/Reveal";
import CountUp from "@/components/motion/CountUp";
import { STATS } from "@/lib/placeholders";

/** 4 count-ups, numbered 01–04. Non-falsifiable metrics only (PLAN.md §2.3) — no invented view counts. */
export default function StatsBand() {
  return (
    <section className="grid grid-cols-2 gap-8 border-y border-text-alt/10 px-6 py-16 sm:px-10 md:grid-cols-4">
      {STATS.map((stat, i) => (
        <Reveal key={stat.n} delay={i * 0.08} className="flex flex-col gap-2">
          <span className="tnum text-ui-sm text-meta">{stat.n}</span>
          <CountUp value={stat.value} className="text-sub-4 text-text-hi" />
          <span className="text-ui text-text-alt">{stat.label}</span>
        </Reveal>
      ))}
    </section>
  );
}
