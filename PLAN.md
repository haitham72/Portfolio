# HaithamMotion — Build Plan

**Target:** motion-graphic-designer portfolio, live before the Fujairah interview (1–2 weeks).
**Reference:** `anamorph.framer.website` (Framer template by Hamza Ehsan, $129).
**Status:** not started. `3-prompts-plan.md` is superseded by this file — it assumed Base44/Supabase + an admin dashboard. Both are cut.

---

## 0. Decisions locked (2026-09-18)

| Decision | Value | Why |
|---|---|---|
| Runtime | Local Next.js 15 (App Router) + TS in `Fujeira hiring/site/` | Sonnet writes real code; Framer-grade motion is not reachable through a no-code prompt loop |
| Database | **None.** No Supabase, no Base44, no Postgres | Nothing here needs a DB |
| CMS | **Filesystem.** Numbered folders under `public/content/` | Drop a file in `03-selected-work/02-foo/` → it appears on next refresh |
| Admin dashboard | **Cut** | It was solving a problem the folders solve |
| Auth | **Cut** | No private surface exists |
| Top priority | **Motion quality** — Apple/iOS-grade feel | Everything else is in service of this; a motion designer is judged on the motion |
| Content | Placeholders now, real work dropped in later | Empty slot → placeholder, no layout shift, no broken section |

---

## 1. What the rolling screenshot missed

The FireShot capture is a static composite of the homepage. Everything below is in the live site and **invisible in that image** — this list is the actual spec surface.

**Evidence basis:** raw HTML (822 KB, curl) + the **browser-saved hydrated page** (3.1 MB) and its `_files/` assets, both in this folder + rendered markdown of `/`, `/work/meridian`, `/work/citadel`.

- **Now verified from hard data:** all text, IDs, hrefs, video sources, module imports, the complete appear-animation keyframe set (§5.0), the type scale and colour system (§5.3), Lenis version and defaults, and the Film Runner easter egg (item 20).
- **Still not verified:** scroll-linked behaviour. The site's own component code lives in `framer.BPJFwsnN.mjs`, `motion.BKNsybgV.mjs` and `RecTimer.DL5xxL1Q.mjs`, which the page-save did not pull — the saved `script_main.mjs` turned out to be the bundled Lenis library plus a Phosphor icon manifest. Items still marked `[inferred]` are therefore genuinely inferred.
- **This no longer blocks anything.** §5.1 specifies the scroll system on its own terms (Apple pattern) rather than reverse-engineering theirs, and §5.0 pins the values that matter. A browser pass is now optional polish, not a prerequisite.

### Global chrome (none of it is in the screenshot)

1. **Fullscreen overlay menu.** "Menu", numbered items `01 Work / 02 Reels / 03 Services / 04 About`, "Get in touch", email, `© 2026`. Opens over everything.
2. **Persistent bottom HUD.** `FRAME 0000` counter + a `Play` control + the `Book a call / Let's roll` pill *(verified text)*. `[inferred]` that the frame number is scroll-linked, and what `Play` does. Either way it is the strongest "it's a reel, not a page" signal on the site — build it scroll-linked; that is the better version regardless of what they did.
3. **Lenis smooth scroll** (`unpkg.com/lenis@1.3.23`) — inertial, weighted. Without it the page feels like a different site regardless of what else is built.
4. **Live REC timecode** via a custom component (`RecTimer.mjs`) — ticks in real time in the hero, `00:14:08:00`.
5. **Per-section running timecode** that increments down the page as one reel: `00:02:00:00` → `00:03:00:00` → `00:04:00:00` → `00:05:00:00` → closing on `END OF REEL — 00:08:00:00`.
6. **Section counter labels** `(0X) — TITLE` with a `+` marker. Numbering also runs *inside* Selected Work per card: `(01) — Selected Work`, `(02) — Selected Work`, `(03) — Selected Work`.

### Animation primitives (structural, not decorative)

7. **Split-character text.** *Verified:* every large headline is exploded into one span per character — `The people who call when it has to feel like film, not content`, `Every frame handled by the same person`, `Let's make something people actually finish`. Per-character DOM splitting exists for exactly one reason, so a staggered per-char reveal is safe to assume. *`[inferred]`:* the exact reveal (mask/`y:100%→0` vs opacity vs scroll-linked) and its timing. **Correction to an earlier read:** each headline appears ×3 in the HTML — that is Framer emitting one copy per breakpoint (`__framer__breakpoints` is present), **not** stacked mask layers. Build one responsive component, not three.
8. **Tickers** — 106 ticker-classed nodes *(verified)*. Client logo band, and a word ticker between work cards (`Karama · Karama · Karama ·`). `[inferred]` direction, speed, hover-pause, any scroll coupling.
9. **Sticky/stacked work cards** — 3 `sticky` declarations *(verified)*; the pin-and-overlap behaviour is `[inferred]`. Same breakpoint caveat as item 7 applies to the tripled card markup.
10. **Stats** `120+ / 48M+ / 12 / 24H`, numbered `01–04` *(verified text)*. Count-up-on-view is `[inferred]`.
11. **Hero timeline ruler** — `00:00  00:30  01:00  01:30  02:00` with faint vertical grid lines.
12. Four inline videos, all `muted loop playsInline`, `#t=0.1` poster-frame trick on three of them.

### Flows & pages

13. **`/work` index** + **`/work/[slug]`** case studies — `meridian`, `citadel`, `karama`. Each: title, metadata rows (Client / Type / Year / Camera / Deliverables), four narrative blocks **The Brief → The Cut → The Grade → The Result**, master video block, **prev/next screening** link, then the shared booking CTA + footer.
14. **`/privacy`** and **`/terms`**.
15. **Booking form flow** — numbered fields `01 NAME / 02 EMAIL / 03 PROJECT (select: Long-form edit · Short-form reels · Colour grade · Motion & titles · Something else) / 04 THE BRIEF`, `Send the brief` submit, `SLOTS FOR JUL: 2 LEFT` scarcity badge, and a 4-stat strip `24H Reply / Revision Rounds / 98% On-time / 5D First Cut`.
16. **Reels device flow** — iPhone frame, Instagram UI (`Reels`/`Friends` tabs, `48.2k` `612` `1.2k`, `@maison.veldt` caption), spec strip `EDITOR · COLOURIST / RUNTIME 0:15 / RATIO 9:16`, autoplay + auto-advance.
17. **Footer structure** — `(00) — STUDIO` blurb, `(01) — NAVIGATION`, `(02) — VISIT US` with opening hours and its own time ruler `00:00 03:00 06:00 09:00 12:00`, giant gradient wordmark, Back To Top.
18. Anchor routing: `#top #services #selected-work #edited-for #reels #about #book #client-notes` *(verified)*.
19. **Page-load sequence — RESOLVED, and it is substantial.** A choreographed **3.75s** entrance across 22 elements, full keyframes in §5.0. Not a spinner-style preloader — the page assembles itself. This is the first thing the interviewer sees; treat it as a deliverable, not a flourish.
20. **Hidden "Film Runner" mini-game** *(verified)*. A `270×110` game board component, `opacity: 0` until triggered — almost certainly behind the HUD `Play` control. Its CSS carries a full set of keyframes: `filmRunnerCoinSpin` (`rotateY 0→360deg`), `filmRunnerCoinBurst` (`scale 1→1.8`, fade), `filmRunnerScorePop` (`translateY 0→−14px`, fade), `filmRunnerShake` (4-step jitter, ±3px), `filmRunnerFlash`, `filmRunnerFadeUp`. An endless-runner easter egg with coin collection and a score pop. **Recommendation: build an equivalent.** For a motion-design portfolio specifically, a hidden interactive toy is the cheapest possible proof that you think in motion rather than just render it — and it is the thing an interviewer remembers and shows someone else. Scope it to Phase 7, cut it without guilt if time runs out.

---

## 2. Positioning changes — do not clone the copy

Anamorph sells a **video editor / colourist freelancer**. You are interviewing as a **motion graphic designer, for a job**. Three changes:

1. **Retarget the Services taxonomy.** Replace `Long-form Edits / Short-form Reels / Colour Grade / Motion & Titles` with motion-design categories: `Brand Motion Systems`, `Title Sequences & Broadcast Packages`, `3D & Compositing`, `Social / Vertical Motion`, `AI-Assisted Pipeline`. Keep the film-reel HUD motif — it still reads for motion.
2. **Cut the Rates section.** Public day rates on a portfolio you hand to a hiring panel anchors you as a freelancer, and anchors your number before you are in the room. Replace `(06) — RATES` with `(06) — PROCESS` (how a brief becomes a delivered package). *If you want it back, say so — it is one section.*
3. **No fabricated metrics or testimonials.** `48M+ views`, `98% on-time`, three named clients praising you — an interviewer opens this site and asks about them. Either use real numbers from Nadi/Hamdan/Faz3 work, or replace the stats strip with non-falsifiable facts (years, disciplines, tools, formats delivered) and drop `(07) — CLIENT REVIEWS` until you have a real quote. Hide-when-empty already handles it.

---

## 3. Architecture

```
Fujeira hiring/site/
├─ app/
│  ├─ layout.tsx            # Lenis provider, cursor, HUD, overlay menu, fonts
│  ├─ page.tsx              # homepage — composes sections 01–08
│  ├─ work/page.tsx         # work index
│  ├─ work/[slug]/page.tsx  # case study (generateStaticParams from folders)
│  ├─ privacy/page.tsx
│  └─ terms/page.tsx
├─ components/
│  ├─ chrome/   Header, OverlayMenu, FrameHUD, Cursor, LenisProvider
│  ├─ motion/   SplitText, Reveal, Ticker, StickyStack, CountUp, Parallax, RecTimer, SectionHeader
│  ├─ media/    LazyVideo, PosterImage, PhoneFrame, ViewfinderFrame, Lightbox
│  └─ sections/ 01Hero … 08Booking (one file each)
├─ lib/
│  ├─ content.ts      # the filesystem scanner (§4)
│  ├─ placeholders.ts # fallback media + copy
│  └─ motion.ts       # easing/spring/duration tokens (§5)
└─ public/content/    # THE CMS — see §4
```

**Stack:** Next.js 15 · TypeScript · Tailwind v4 · `motion` (Framer Motion) · `lenis` · zero other runtime deps.
**Contact form:** no backend. Submit composes a `mailto:` with the fields prefilled, plus a copy-email-to-clipboard affordance. Swap for Formspree later if wanted — one env var.
**Deploy:** Vercel, or a static export to any host. Nothing server-side is required.

---

## 4. The filesystem CMS (this is the contract — build it first)

```
public/content/
├─ 01-hero/
│  ├─ background.mp4          # or .jpg — first file wins
│  └─ portrait.jpg            # floating intro card
├─ 02-edited-for/             # client logo ticker; hidden if empty
│  ├─ 01-client-name.svg
│  └─ 02-client-name.png
├─ 03-selected-work/
│  ├─ 01-project-name/
│  │  ├─ meta.json            # OPTIONAL overrides
│  │  ├─ cover.jpg            # card poster
│  │  ├─ master.mp4           # 16:9 hero video
│  │  └─ 01-still.jpg …       # case-study body stills, ordered
│  └─ 02-project-name/
├─ 04-reels/                  # 9:16
│  ├─ 01-reel-name.mp4
│  └─ 01-reel-name.jpg        # poster: same stem = auto-paired
├─ 05-services/               # optional per-service still/loop
│  └─ 01-brand-motion-systems.mp4
├─ 06-about/
│  ├─ portrait.jpg
│  └─ signature.png
├─ 07-reviews/                # hidden if empty
│  └─ 01-name.json
└─ _placeholders/             # shipped fallbacks, never edited by you
```

**Rules Sonnet implements in `lib/content.ts`:**

- Order = numeric prefix, ascending. Renumber a folder → order changes. No config file to edit.
- Title = slug after the prefix, de-hyphenated, title-cased. `01-doha-metro-titles` → *Doha Metro Titles*.
- `meta.json` overrides anything derived: `{ title, client, year, role, category, annotation, ratio, brief, approach, system, result }`. Absent = derived/placeholder.
- Aspect ratio inferred from the section (`03-` → 16:9, `04-` → 9:16) unless `meta.json` says otherwise.
- Poster pairing: `<stem>.jpg|png|webp` next to `<stem>.mp4`. No poster → `#t=0.1` first-frame fallback.
- **Empty folder → placeholder, never a broken or blank section.** A section whose folder is empty *and* is marked `hideWhenEmpty` (`02-edited-for`, `07-reviews`) is omitted entirely.
- **Dev affordance:** in `NODE_ENV=development` only, placeholder slots render a small corner tag `PLACEHOLDER · 03-selected-work/02-*` so you can see at a glance which folders are still empty. Invisible in production.
- Scanner runs in a server component at build; dev uses `revalidate: 0` so dropping a file + refresh is enough. No restart.
- Every folder ships pre-created with a `.gitkeep` and a `README.txt` naming what goes in it and at what spec.

**Media spec** (put in each README.txt): 16:9 → 1920×1080 H.264 `.mp4`, ≤8 MB, no audio track. 9:16 → 1080×1920, ≤6 MB. Posters → WebP, ≤200 KB. Logos → SVG preferred.

---

## 5. Motion system — the priority

Apple/iOS feel is not "more animation". It is four things: **slow, one easing curve everywhere, scroll-linked rather than scroll-triggered, and nothing that drops a frame.**

### 5.0 Verified reference values

Extracted from the reference's `__framer__appearAnimationsContent` blob — these are the template's real keyframes, not estimates. 22 animated elements:

- **One easing curve for everything: `[0.16, 1, 0.3, 1]`.** All 22. No exceptions.
- **Tween only. Zero springs.** Springs are for hover/press interaction here, nothing else.
- **Durations 0.6 → 2.4s.** Far slower than typical web motion; this is most of why it reads cinematic. Short `0.6s` is reserved for small chrome items.
- **Hero: `scale 1.06 → 1` over 2.4s.** This is the signature "slight zoom" — a 6% settle, nothing more.
- **Slab reveals: `y: ±860 → 0` over 1.5s**, alternating direction (`+860`, `−860`, `+860`, `−860`), staggered 0.25s apart.
- **Small items: `y: 18 → 0` or `y: −8 → 0`**, 0.6–1.4s.
- `opacity: 0.001 → 1`, never `0` (avoids a first-paint flash). The oversized wordmark animates to `0.3`, not `1`.
- **Load choreography is real and answers item 19: a 3.75s cascade**, delays stepping `0 → 0.25 → 0.45 → 0.65 → 0.9 → 1.15 → 1.4 → 1.65 → 1.9 → 2.15 → 2.4 → 2.65 → 2.9 → 3.15`. Roughly 0.25s between entrances, longest elements starting first.

**Tokens (`lib/motion.ts`), used everywhere — no ad-hoc values:**

```ts
// Verified against the reference. Do not invent new easings.
export const ease = { out: [0.16, 1, 0.30, 1] } as const;   // the only curve

export const dur = {
  chrome: 0.6,   // HUD, labels, small UI
  base:   1.4,   // standard block reveal
  slab:   1.5,   // large y:±860 panel reveals
  hero:   2.4,   // hero scale-settle + wordmark
} as const;

export const stagger = { char: 0.018, item: 0.25 } as const; // 0.25 = reference cadence

export const zoom = { in: 1.06, rest: 1, out: 0.96 } as const; // the scale-breathe

// Springs ONLY for pointer interaction — never for reveals.
export const spring = {
  snap: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
} as const;
```

### 5.1 Scroll-flow system — the Apple pattern (top priority)

This is the brief: **slides that zoom slightly in and out, driven by scroll, with sections that capture the scroll and animate in place.** Three mechanics, composed:

**A. Scroll-capture (pinned) sections.** A tall outer container (`300–400vh`) with an inner `position: sticky; top: 0; height: 100vh`. The page scroll no longer moves the content — it drives the animation inside. This is what "iPhone flow" actually is mechanically. Use `useScroll({ target, offset: ['start start', 'end end'] })` → `useTransform` on the inner layers. **Never intercept the wheel event.** The scroll stays native; only the mapping changes. Scroll-jacking breaks trackpads, breaks mobile, and reads as cheap.

**B. Scale-breathe on every slide.** Each slide/card is scroll-linked across its own viewport pass, not triggered once:
```
progress 0 ──── 0.5 ──── 1
scale     1.06    1.00    0.96
opacity   0       1       0.55
blur      6px     0       3px      (at most one blurring element at a time)
```
Driven with `useScroll({ offset: ['start end', 'end start'] })`. The result is content that always feels like it is settling toward you and easing away — that is the whole effect, and it is 6%, not 20%. Overdo the scale and it reads as a PowerPoint transition.

**C. Layered parallax inside each pinned section.** Background media moves at ~0.85× scroll rate, midground 1×, foreground text ~1.15×. Small differences only. Combined with (B) this produces depth without any 3D.

**Apply pinned scroll-capture to exactly these sections** — not everywhere, or it becomes exhausting:
1. Hero → pinned; wordmark scales `1.06 → 1`, timeline ruler drifts, bg video scrubs or loops.
2. Selected Work → pinned stack; each card scale-breathes as the next overlaps it.
3. Reels (iPhone) → pinned; the device holds centre while reels advance inside it.
4. About → pinned; the credit list reveals line by line against scroll progress.

Every other section uses plain scroll-triggered reveals from §5.2. The contrast is what makes the pinned ones land.

**D. Page-load choreography.** Reproduce the 3.75s cascade from §5.0 on first paint only (`sessionStorage` flag so it does not replay on back-navigation). Slabs alternate in from `y: +860 / −860` at 0.25s intervals, hero settles `1.06 → 1` across the whole 2.4s underneath them, chrome and HUD land last at 2.15–3.15s. This sequence is the first thing the interviewer sees. Budget real time for it.

### 5.2 Primitives

**Primitives to build (in this order — everything else composes from them):**

1. `LenisProvider` — `lerp: 0.085`, `wheelMultiplier: 1`, `syncTouch: false`. Bridge Lenis's rAF into Framer Motion's `useScroll` so scroll-linked animation and smooth scroll share one clock. Getting this wrong causes the jitter that kills the whole feel.
2. `SplitText` — splits to chars (headlines) or words (body). Each char in an `overflow-hidden` wrapper animating `y: 100% → 0` + opacity, `ease.out`, `stagger.char`, `viewport: { once: true, margin: '-15%' }`. Transform only — never `top`/`margin`.
3. `Reveal` — generic block version: `y: 32 → 0`, `opacity 0 → 1`, `dur.base`, `ease.out`.
4. `Ticker` — rAF-driven translateX (not CSS keyframes) so it can velocity-couple to scroll: base speed + `scrollVelocity * k`, direction flips with scroll direction, pauses on hover, seamless duplicate-and-wrap.
5. `StickyStack` — Selected Work. Each card `position: sticky; top: <n>vh`. Outgoing card `scale 1 → 0.94`, `opacity → 0.5`, `blur 0 → 4px`, driven by `useScroll({ offset: ['start start','end start'] })`.
6. `FrameHUD` — fixed bottom bar. Frame counter = `Math.floor(scrollProgress * totalFrames)` zero-padded to 4, monospace, `tabular-nums`. `Play` scrolls to the reel and opens the lightbox.
7. `RecTimer` — `requestAnimationFrame`, renders `HH:MM:SS:FF` at 24fps, red dot `#FF4500` pulsing at 1Hz.
8. `CountUp` — spring-driven, `tabular-nums`, fires once on enter.
9. `LazyVideo` — IntersectionObserver, `preload="none"` until ~200px from viewport, then `autoplay muted loop playsInline`, pauses off-screen, poster always painted first. Hard requirement: **more than two simultaneously decoding videos tanks the frame rate** — pause anything out of view, no exceptions.
10. `Cursor` — dot + label, lerped follow, grows on interactive hover, shows `PLAY` over video. Desktop / fine-pointer only.

**Non-negotiable perf rules:**

- Animate `transform` and `opacity` only. `filter: blur` on at most one element at a time.
- `will-change` applied on animation start, removed on end.
- All buttons **flat** — solid or outline pill, full radius, **zero box-shadow**, hover = `spring.snap` scale/colour only.
- `prefers-reduced-motion: reduce` → Lenis off, tickers static, split-text renders instantly, videos show posters with a play affordance. Built into every primitive, not a pass at the end.
- Budget: 60fps sustained scroll on a mid laptop, LCP < 2.5s, total homepage video weight < 20 MB.

### 5.3 Visual system — verified from the saved page

**Colour.** Extracted, not guessed:

```
--bg          #0A0A0A   near-black base
--surface     #0D0D0D   raised panels (most-used value on the page)
--text        #EDE8DC   warm cream — NOT pure white
--text-alt    #E3DCCB   secondary cream
--text-hi     #F4F2ED   highest-contrast cream
--meta        #787878   labels, timecodes, section numbers
--rec         #FF4500   REC dot / accent
--rec-deep    #DB3903   accent pressed
--warn        #EF0008   error state only
```

The single most copyable decision here: **text is cream `#EDE8DC`, not `#FFFFFF`.** Pure white on near-black is what makes a dark portfolio read as a template. The cream is why theirs reads as film.

**Type.** Real face is **BDO Grotesk Variable** (Inter is only Framer's fallback). Substitute if unlicensed: *General Sans*, *Neue Montreal*, or *Satoshi* — all free, same geometric-grotesk register. The scale is deliberately **two-pole, with nothing in the middle**:

| Role | Size | Tracking |
|---|---|---|
| Display | **120px** (18 uses — the dominant size on the page) | `-0.07em` |
| Sub-display | 77 / 64 / 60 / 48px | `-0.07em` |
| Body | 24 / 18px | `-0.02em` |
| UI / meta | 15 / 13px | `-0.05em` |
| Micro-labels | **10px** | `-0.05em` / `0em` |

Tight negative tracking on everything is half the look — `-0.07em` on display is aggressive and intentional. Jumping straight from 120px to 13px with no 30–40px tier is the other half. Do not "fix" that gap by adding intermediate sizes.

Oversized low-opacity wordmark as background motif — animates to `opacity: 0.3`, per §5.0. Monospace with `tabular-nums` for every timecode, frame number and stat; the numbers must not jitter in width as they tick.

---

## 6. Section build spec

Page order differs from `3-prompts-plan.md` — Services sits after Work, per your Prompt 2 note.

| # | Section | Anchor | Key elements | Hide if empty |
|---|---|---|---|---|
| — | Header + Overlay menu | — | Sticky bar, wordmark, 4 links, flat CTA pill; fullscreen overlay with numbered `01–04`, email, copyright | no |
| — | Frame HUD | — | `FRAME 0000` scroll-linked counter, `Play`, CTA pill | no |
| 01 | Hero | `#top` | Timeline ruler `00:00–02:00` + grid lines, REC dot + live timecode, split-char wordmark, bg video, floating intro card | no |
| — | Statement band | — | Split-char marquee, ×3 rows, velocity-coupled | no |
| 02 | Edited For | `#edited-for` | Logo ticker, grayscale → colour on hover | **yes** |
| — | Stats | — | 4 count-ups, numbered `01–04`, non-falsifiable metrics only (§2.3) | no |
| 03 | Selected Work | `#selected-work` | Sticky stacked cards, per-card `(0X) — Selected Work`, hover→preview, click→`/work/[slug]`, word ticker between cards | no |
| 04 | Reels | `#reels` | iPhone frame + IG UI, autoplay, auto-advance ~6s, scroll-snap override, spec strip, split `Short / Form` heading | no |
| 05 | Services | `#services` | 4–5 alternating numbered rows, loop/still per service, motion-design taxonomy (§2.1) | no |
| 06 | Process | — | Replaces Rates (§2.2) — brief → boards → animatic → delivery, numbered | no |
| 07 | About | `#about` | Split-char headline, credit list (DESIGN / ANIMATION / 3D / COMP / SOUND = one name), portrait, signature | no |
| 08 | Booking | `#book` | Numbered form `01–04`, `mailto:` submit, availability badge, 4-stat strip, `END OF REEL — 00:08:00:00` | no |
| — | Footer | — | `(00) STUDIO` / `(01) NAVIGATION` / `(02) VISIT US` + hours + time ruler, giant gradient wordmark, Back To Top | no |

**Sub-pages:** `/work` (grid index) · `/work/[slug]` (metadata rows → The Brief / The Approach / The System / The Result → master video → prev-next → shared booking CTA + footer) · `/privacy` · `/terms`.

---

## 7. Build order

Sequenced so the site is demo-able at the end of every phase. If time runs out you stop at the current phase and still have something sendable.

**Phase 1 — foundation (day 1–2)**
`create-next-app`, Tailwind, fonts, colour tokens, `lib/motion.ts`, `LenisProvider`, `lib/content.ts` + the full `public/content/` tree with READMEs and `_placeholders`.
**Gate:** drop a random mp4 into `03-selected-work/01-test/` and it appears on refresh. Nothing else starts until this passes.

**Phase 2 — motion primitives (day 2–3)**
`SplitText`, `Reveal`, `Ticker`, `StickyStack`, `CountUp`, `LazyVideo`, `RecTimer`, `SectionHeader`. Build them on a `/lab` route in isolation, each with its reduced-motion variant.
**Gate:** `/lab` scrolls at 60fps with everything running at once. This phase is where the "gorgeous" is won or lost — do not rush it to get to sections.

**Phase 3 — chrome (day 3–4)**
Header, overlay menu, `FrameHUD`, cursor, anchor routing, page transitions.

**Phase 4 — the money sections (day 4–7)**
Hero → Statement band → Selected Work (sticky stack) → Reels (phone). These four carry the interview. Full polish here before touching anything below.

**Phase 5 — remaining sections (day 7–9)**
Edited For, Stats, Services, Process, About, Booking, Footer.

**Phase 6 — sub-pages (day 9–10)**
`/work`, `/work/[slug]`, `/privacy`, `/terms`.

**Phase 7 — polish + ship (day 10–12)**
Responsive pass (360 / 768 / 1440 / 1920), reduced-motion audit, Lighthouse, flat-button audit, real content swap-in, deploy, domain. **Stretch: the hidden mini-game (item 20)** — highest signal-per-hour item on the whole list for a motion role, and the safest thing to cut.

**Reference assets (already in this folder, do not delete):**
`Anamorph™ … .html` (3.1 MB hydrated save) + `Anamorph™ … _files/` — the source for every verified value in §5.0 and §5.3. Grep it rather than guessing. The `FireShot …jpg` is layout reference only; it shows no motion. `3-prompts-plan.md` is superseded — keep for history, do not build from it.

**Parallel track, yours not Sonnet's:** cut 3 case-study pieces + 4–6 vertical reels, encode to spec, drop into the numbered folders. The site does not block on this, and this does not block the site.

---

## 8. Definition of done

- [ ] Empty `public/content/` → site renders complete, nothing broken, no layout shift
- [ ] Adding a numbered folder + a file → appears on refresh, correct order, no code edit
- [ ] Removing content → section hides or falls back cleanly
- [ ] 60fps sustained scroll, desktop and mobile
- [ ] `prefers-reduced-motion` → fully usable, zero auto-motion
- [ ] Zero raised or shadowed buttons anywhere
- [ ] Every timecode / frame / stat uses `tabular-nums` and does not jitter
- [ ] No fabricated client names, metrics, or testimonials
- [ ] Keyboard: overlay menu Esc, lightbox Esc + arrows, visible focus rings
- [ ] Works at 360px wide
- [ ] Deployed at a URL you can paste into an email

---

## 9. Open items for you

1. Domain — needed by Phase 7.
2. Real stat numbers, or confirm the non-falsifiable set.
3. Confirm Rates stays cut.
4. Nadi / Hamdan / Faz3 material — what is clearable for a public portfolio? Affects nothing until Phase 7, but decide early.
