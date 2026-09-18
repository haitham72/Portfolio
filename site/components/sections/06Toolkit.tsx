import SectionHeader from "@/components/motion/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import Ticker from "@/components/motion/Ticker";
import ToolkitLogo from "@/components/media/ToolkitLogo";
import { TOOLKIT } from "@/lib/placeholders";

/**
 * The toolkit — real software, one auto-scrolling row per category (Video /
 * VFX / Design / AI Creative), alternating direction per row, pauses on
 * hover. Back to the animated marquee — the static grid read as flat and
 * empty on rows with few tools. Each row now carries enough icons (5-8) to
 * loop without an obvious gap, and the icons are 1.5x the original size.
 * Real brand SVGs via cdn.simpleicons.org where that brand actually has
 * one (confirmed by curl, not guessed); an initials badge everywhere else —
 * still the primary path for about half this list (every Adobe app, most AI tools).
 */
export default function Toolkit() {
  return (
    <section id="toolkit" className="border-y border-text-alt/10 px-6 py-20 sm:px-10">
      <SectionHeader number="06" title="Toolkit" className="mb-4" />
      <Reveal className="mb-10 max-w-lg text-body text-text-alt">
        The visual production toolkit behind every frame.
      </Reveal>

      <div className="flex flex-col gap-10">
        {TOOLKIT.map((row, i) => (
          <div key={row.category} className="flex flex-col gap-4">
            <span className="text-ui-sm uppercase tracking-tight text-meta">{row.category}</span>
            <Ticker speed={26} direction={i % 2 === 0 ? -1 : 1}>
              {row.tools.map((tool) => (
                <ToolkitLogo key={tool.name} name={tool.name} slug={tool.slug} initials={tool.initials} />
              ))}
            </Ticker>
          </div>
        ))}
      </div>
    </section>
  );
}
