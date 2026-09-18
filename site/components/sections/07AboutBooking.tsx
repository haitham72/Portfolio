"use client";

import { useState, type FormEvent } from "react";
import SectionHeader from "@/components/motion/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import PosterImage from "@/components/media/PosterImage";
import { COPY, SITE, BOOKING_STATS, gradientFor } from "@/lib/placeholders";
import type { AboutContent } from "@/lib/content";

const PROJECT_TYPES = ["Long-form edit", "Short-form reels", "Colour grade", "Motion & titles", "Something else"];

/** About and Booking merged into one section, per request — image on the right, name/details/contact on the left. */
export default function AboutBooking({ about }: { about: AboutContent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState(PROJECT_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`New brief — ${project}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nProject: ${project}\n\n${brief}`);
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the mailto link still works
    }
  }

  return (
    <section id="about" className="border-y border-text-alt/10 px-6 py-24 sm:px-10">
      <SectionHeader number="07" title="About" className="mb-8" />

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        {/* LEFT: name, details, contact */}
        <div className="flex flex-col gap-14">
          <div>
            <h2 className="text-sub-2 tracking-tight text-text-hi">
              <SplitText as="span">{SITE.name}</SplitText>
            </h2>
            <p className="mt-1 text-ui text-meta">{SITE.title}</p>
            <p className="mt-6 max-w-md text-body text-text-alt">{COPY.aboutBody}</p>

            <Reveal delay={0.1} className="mt-8 max-w-md text-body text-text-alt">
              {COPY.whatIDo}
            </Reveal>
          </div>

          <div id="book">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <h3 className="text-sub-3 tracking-tight text-text-hi">{COPY.bookingHeadline}</h3>
              <span className="tnum rounded-full border border-rec/40 px-3 py-1 text-ui-sm text-rec">SLOTS: 2 LEFT</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="tnum text-ui-sm text-meta">01 NAME</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-b border-text-alt/20 bg-transparent py-2 text-body text-text-hi outline-none focus-visible:border-rec"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="tnum text-ui-sm text-meta">02 EMAIL</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-b border-text-alt/20 bg-transparent py-2 text-body text-text-hi outline-none focus-visible:border-rec"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="tnum text-ui-sm text-meta">03 PROJECT</span>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="border-b border-text-alt/20 bg-transparent py-2 text-body text-text-hi outline-none focus-visible:border-rec"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-surface">
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="tnum text-ui-sm text-meta">04 THE BRIEF</span>
                <textarea
                  required
                  rows={3}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="resize-none border-b border-text-alt/20 bg-transparent py-2 text-body text-text-hi outline-none focus-visible:border-rec"
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" className="btn-pill btn-pill--solid w-fit">
                  Send the brief
                </button>
                <button type="button" onClick={copyEmail} className="btn-pill btn-pill--outline w-fit text-ui-sm">
                  {copied ? "Copied" : SITE.email}
                </button>
                <a href={`tel:${SITE.phoneHref}`} className="tnum btn-pill btn-pill--outline w-fit text-ui-sm">
                  {SITE.phone}
                </a>
              </div>
            </form>

            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {BOOKING_STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="tnum text-sub-4 text-text-hi">{stat.value}</span>
                  <span className="text-ui-sm text-meta">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: portrait, stays in view while the left column scrolls */}
        <Reveal delay={0.1} className="lg:sticky lg:top-28 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border border-text-alt/10">
            <PosterImage src={about.portrait} alt={SITE.name} className="aspect-[3/4] w-full" gradient={gradientFor(2)} />
          </div>
        </Reveal>
      </div>

      <p className="tnum mt-20 text-center text-ui-sm text-meta">{COPY.endOfReel} &mdash; 00:08:00:00</p>
    </section>
  );
}
