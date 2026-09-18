import Ticker from "@/components/motion/Ticker";
import { COPY } from "@/lib/placeholders";

const ROWS = [
  { speed: 34, outline: false },
  { speed: 26, outline: true },
  { speed: 40, outline: false },
] as const;

/** Split-char marquee, ×3 rows, velocity-coupled — the statement band between Hero and Edited For. */
export default function StatementBand() {
  return (
    <section className="flex flex-col gap-2 border-y border-text-alt/10 py-10">
      {ROWS.map((row, i) => (
        <Ticker key={i} speed={row.speed}>
          <span
            className={`mr-12 shrink-0 whitespace-nowrap text-sub-4 tracking-tight ${
              row.outline ? "text-transparent [-webkit-text-stroke:1px_var(--text-alt)]" : "text-text-alt/90"
            }`}
          >
            {COPY.statement} &middot;&nbsp;
          </span>
        </Ticker>
      ))}
    </section>
  );
}
