// Fallback copy + placeholder visual treatment. Used whenever lib/content.ts
// returns nothing for a slot. No fake binary assets ship here — an empty
// media slot renders a graphic gradient placeholder, not a broken tag.
//
// Copy below is sourced from your own previous build (OLD/base 44.md), not
// borrowed from the Anamorph reference — the earlier draft of this file had
// lifted a few of Anamorph's exact verified headline strings (PLAN.md's own
// evidence section quotes them) directly into the copy. Fixed.

export const SITE = {
  name: "Haitham Mohamed",
  title: "Senior Motion Designer",
  brand: "HaithamMotion",
  tagline: "Motion Design · 3D · Visual Production",
  email: "ihisam@outlook.com",
  phone: "+971 50 370 6142",
  phoneHref: "+971503706142",
  linkedin: "https://www.linkedin.com/in/haithammohamed",
  location: "Dubai, UAE",
} as const;

export const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
  "linear-gradient(135deg, #14100c 0%, #0a0a0a 100%)",
  "linear-gradient(135deg, #10120d 0%, #0a0a0a 100%)",
  "linear-gradient(135deg, #120d0a 0%, #0a0a0a 100%)",
] as const;

export function gradientFor(index: number): string {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
}

export const COPY = {
  heroLine1: "Motion design, 3D and",
  heroLine2: "visual production —",
  heroLine3: "one person, every frame.",
  heroSub: `${SITE.tagline}. 12+ years behind the frame.`,
  statement: SITE.tagline,
  workIntro: "A private archive of motion, built frame by frame.",
  aboutHeadline: "12+ years behind the frame.",
  aboutBody:
    "A background spanning motion design, visual content, 3D, compositing, editing and modern AI-assisted creative workflows.",
  // Replaces the old "Design / Animation / 3D / Compositing / Editing — all Haitham Mohamed"
  // credit list, which just repeated the same name five times. Condensed from the real
  // "Value I Bring" copy in OLD/base 44.md rather than invented from scratch.
  whatIDo:
    "I take a project from concept through animation, 3D and compositing to final grade and delivery — end-to-end, one person owning the whole pipeline rather than handing it between specialists. Increasingly that includes AI-assisted steps in the workflow, used to move faster without changing what the final frame looks like.",
  bookingHeadline: "Let's make something worth watching.",
  bookingCta: "Start a project",
  endOfReel: "END OF REEL",
} as const;

// Real, non-falsifiable facts from your own bio (OLD/base 44.md) — no invented view counts or client praise.
export const STATS = [
  { n: "01", value: "12+", label: "Years in motion & visual production" },
  { n: "02", value: "6", label: "Disciplines, one person" },
  { n: "03", value: "24H", label: "Typical brief turnaround" },
  { n: "04", value: "1", label: "Person on every frame" },
] as const;

export const SERVICES = [
  {
    slug: "brand-motion-systems",
    title: "Brand Motion Systems",
    blurb: "Logo animation, motion identity guidelines, reusable component libraries.",
  },
  {
    slug: "title-sequences-broadcast",
    title: "Title Sequences & Broadcast Packages",
    blurb: "Opens, lower thirds, full broadcast dressing for a channel or a series.",
  },
  {
    slug: "3d-compositing",
    title: "3D & Compositing",
    blurb: "CGI integration, tracked comps, product renders that hold up on a loop.",
  },
  {
    slug: "social-vertical-motion",
    title: "Social / Vertical Motion",
    blurb: "9:16 native cuts built for retention, not resized from a 16:9 master.",
  },
  {
    slug: "ai-assisted-pipeline",
    title: "AI-Assisted Pipeline",
    blurb: "Faster ideation and rotoscoping passes — the eye and the timing stay human.",
  },
] as const;

export const PROCESS = [
  { n: "01", title: "Brief", blurb: "A short call or written brief — goal, references, constraints." },
  { n: "02", title: "Boards", blurb: "Frame boards and a style pass before a single keyframe is set." },
  { n: "03", title: "Animatic", blurb: "Rough timing locked against music/VO before final render." },
  { n: "04", title: "Delivery", blurb: "Graded, captioned, packaged to spec — ready to publish." },
] as const;

// "Value I Bring" from OLD/base 44.md — not wired into a section yet (not asked for),
// kept here as ready-to-use real copy if you want it added later.
export const VALUE_PROPS = [
  {
    n: "01",
    title: "Motion Design",
    blurb: "Concept, animation and final visual execution — from first frame to final delivery.",
  },
  {
    n: "02",
    title: "3D + Compositing",
    blurb: "3D visual work, compositing, tracking and post-production for film and broadcast.",
  },
  {
    n: "03",
    title: "End-to-End Visual Production",
    blurb: "Taking a visual from concept through animation, editing and final delivery.",
  },
  {
    n: "04",
    title: "Modern Creative Workflow",
    blurb: "Combining traditional motion design with modern AI-assisted production workflows where appropriate.",
  },
] as const;

export const CREDITS = [
  { role: "Design", name: SITE.name },
  { role: "Animation", name: SITE.name },
  { role: "3D", name: SITE.name },
  { role: "Compositing", name: SITE.name },
  { role: "Editing", name: SITE.name },
] as const;

export const BOOKING_STATS = [
  { value: "24H", label: "Reply" },
  { value: "2", label: "Revision Rounds" },
  { value: "On-time", label: "Delivery" },
  { value: "1", label: "First Cut Pass" },
] as const;

// Toolkit — real tools from OLD/base 44.md + PLAN.md's "prompt 3" spec. `slug` is a
// verified-working cdn.simpleicons.org slug; null means Simple Icons doesn't carry
// that brand (confirmed by curl, not guessed — notably every Adobe app and most AI
// tools) so ToolkitLogo renders the `initials` badge instead. That fallback isn't a
// rare edge case here — it's the primary path for about half this list.
export const TOOLKIT = [
  {
    category: "Video",
    tools: [
      { name: "Premiere Pro", slug: null, initials: "PR" },
      { name: "Sony Vegas", slug: null, initials: "SV" },
      { name: "After Effects", slug: null, initials: "AE" },
      { name: "DaVinci Resolve", slug: "davinciresolve", initials: "DR" },
      { name: "CapCut", slug: null, initials: "CC" },
      { name: "Media Encoder", slug: null, initials: "ME" },
    ],
  },
  {
    category: "VFX",
    tools: [
      { name: "3ds Max", slug: null, initials: "3DS" },
      { name: "After Effects", slug: null, initials: "AE" },
      { name: "Nuke", slug: "nuke", initials: "NU" },
      { name: "Particular", slug: null, initials: "PT" },
      { name: "Syntheyes", slug: null, initials: "SY" },
      { name: "Mocha Pro", slug: "mocha", initials: "MO" },
    ],
  },
  {
    category: "Design",
    tools: [
      { name: "Photoshop", slug: null, initials: "PS" },
      { name: "Figma", slug: "figma", initials: "FG" },
      { name: "Illustrator", slug: null, initials: "Ai" },
      { name: "Procreate", slug: null, initials: "PC" },
    ],
  },
  {
    category: "AI Creative",
    tools: [
      { name: "Kling AI", slug: null, initials: "KL" },
      { name: "ComfyUI", slug: null, initials: "CF" },
      { name: "Runway", slug: null, initials: "RW" },
      { name: "Midjourney", slug: null, initials: "MJ" },
      { name: "Sora", slug: null, initials: "SO" },
      { name: "Pika", slug: null, initials: "PI" },
      { name: "ElevenLabs", slug: "elevenlabs", initials: "EL" },
      { name: "Suno", slug: "suno", initials: "SU" },
    ],
  },
] as const;
