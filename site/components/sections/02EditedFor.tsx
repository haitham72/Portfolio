import Image from "next/image";
import SectionHeader from "@/components/motion/SectionHeader";
import Ticker from "@/components/motion/Ticker";
import type { LogoItem } from "@/lib/content";

/** Client logo ticker. Hide-when-empty — the whole section disappears, not a placeholder ticker. */
export default function EditedFor({ logos }: { logos: LogoItem[] }) {
  if (logos.length === 0) return null;

  return (
    <section id="edited-for" className="px-6 py-20 sm:px-10">
      <SectionHeader number="02" title="Edited For" className="mb-8" />
      <Ticker speed={30}>
        <div className="flex items-center gap-16 pr-16">
          {logos.map((logo) => (
            <div key={logo.slug} className="relative h-8 w-28 shrink-0 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0">
              <Image src={logo.src} alt={logo.title} fill className="object-contain" />
            </div>
          ))}
        </div>
      </Ticker>
    </section>
  );
}
