import SectionHeader from "@/components/motion/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import { PROCESS } from "@/lib/placeholders";

/** Replaces Rates (PLAN.md §2.2) — public day rates on an interview portfolio anchor you as a freelancer. */
export default function Process() {
  return (
    <section className="border-y border-text-alt/10 px-6 py-24 sm:px-10">
      <SectionHeader number="05" title="Process" className="mb-12" />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.08} className="flex flex-col gap-3">
            <span className="tnum text-ui-sm text-meta">{step.n}</span>
            <h3 className="text-sub-4 tracking-tight text-text-hi">{step.title}</h3>
            <p className="text-body text-text-alt">{step.blurb}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
