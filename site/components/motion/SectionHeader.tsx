import Reveal from "./Reveal";

interface SectionHeaderProps {
  number: string; // "01".."08"
  title: string;
  className?: string;
}

/** `(0X) — TITLE +` — the numbered section-counter label used throughout. */
export default function SectionHeader({ number, title, className }: SectionHeaderProps) {
  return (
    <Reveal y={12} duration={0.6} className={`flex items-center gap-3 text-ui uppercase text-meta ${className ?? ""}`}>
      <span className="tnum">({number})</span>
      <span aria-hidden>&mdash;</span>
      <span>{title}</span>
      <span aria-hidden>+</span>
    </Reveal>
  );
}
