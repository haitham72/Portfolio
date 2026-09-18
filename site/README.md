# HaithamMotion — Portfolio Site

Next.js 15 (App Router) + TypeScript + Tailwind v4 + `motion` + `lenis`. Built per `../PLAN.md`,
checked (not rebuilt) against `../OLD/3-prompts-plan.md`'s "prompt 3" spec and your real bio in
`../OLD/base 44.md`.
Package manager is **pnpm** — this machine's global npm config restricts install scripts to pnpm
only (`allow-scripts=pnpm` in the user `.npmrc`), so `npm install` will fail here by design.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build + typecheck + lint
```

If `pnpm dev` ever throws a webpack "module is not a function" / React Client Manifest error
after a long hot-reload session, it's stale `.next` HMR state, not a code bug — stop the server,
`rm -rf .next`, restart. `pnpm build` is the real correctness signal; it's been clean throughout.

## Private preview / Google sign-in gate

The entire site is gated behind Google sign-in — nobody sees anything until they're signed in,
and every new sign-in lands as `access = "limited"` by default. There's no in-app admin UI for
this by design: to let someone in, you open Supabase's Table Editor and change their row's
`access` from `limited` to `allowed` yourself, any time. Code: `middleware.ts`, `app/login/`,
`app/auth/callback/`, `app/pending/`, `lib/supabase/browserClient.ts`, `supabase/schema.sql`.

**I can't finish setup for you** — it needs your own Supabase project and your own Google Cloud
OAuth credentials, both account-level things I have no way to create. Here's the exact path:

1. **Run the migration.** Supabase dashboard → SQL Editor → New query → paste all of
   `supabase/schema.sql` → Run. (I tried to run this for you directly against the connection
   string you pasted, but this sandbox's network only allows HTTP/HTTPS egress — raw Postgres
   on port 6543 is blocked, confirmed with a direct TCP check, not a bug in the script. This is
   the one remaining manual step and it's 10 seconds of copy-paste.)
2. **Get your API credentials.** Supabase dashboard → Settings → API. Copy the **Project URL**,
   **anon public** key, and **service_role** key (click reveal).
3. **Set up Google OAuth.** In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   create an OAuth 2.0 Client ID (Web application). Authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback` (find `<your-project-ref>` in the
   Supabase Project URL from step 2). Copy the generated Client ID and Client Secret.
4. **Enable the provider in Supabase.** Dashboard → Authentication → Providers → Google → paste
   the Client ID/Secret from step 3 → Save.
5. **Set environment variables.** Copy `.env.local.example` to `.env.local` and fill in the three
   values from step 2:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```

   `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — it's read only in `middleware.ts`
   (server-side), never in a `"use client"` file, and must never get a `NEXT_PUBLIC_` prefix.
6. **Same three variables on Vercel** before deploying: Project → Settings → Environment
   Variables → add all three for Production (and Preview, if you want previews gated too).
7. **Test locally** (`pnpm dev`, visit `/`) — you'll be bounced to `/login`, sign in with Google,
   land on `/pending`. Then in Supabase's Table Editor, find your row in `public.users` and
   change `access` to `allowed`. Refresh — you're in.

Without steps 1-6 done, the site fails loudly (500, not a silent bypass) rather than serving
content ungated — confirmed locally: it throws "Your project's URL and Key are required" until
real credentials are set. That's intentional fail-closed behavior, not a bug to fix.

**One thing worth flagging:** you pasted your database password in plaintext in this chat to give
me the connection string. It's not written into any file in this repo, but it is now in this
conversation's history — worth rotating (Supabase → Settings → Database → Reset password) once
you've finished setup, as routine hygiene rather than because anything's actually been misused.

## Add content — no code, no restart

Everything under `public/content/` is scanned by `lib/content.ts` on every request in dev
(prod bakes it in at build time). Drop a file into the matching numbered folder and refresh —
see the `README.txt` in each `public/content/*/` folder for exact specs (dimensions, codecs,
size limits). Empty folders render placeholders, never a broken layout; in dev they're tagged
`PLACEHOLDER · ...` in the corner so you can see what's still missing.

**Right now several folders are filled with free stock media** (Picsum stock photos, trimmed
clips from public-domain Blender Foundation shorts) so the site doesn't look empty in a demo —
every one of them is tagged `"stockPlaceholder": true` in its `meta.json`, which shows a small
red "Stock placeholder" badge in dev mode (invisible in production, but it's not real work —
don't ship it to Fujairah as-is):

- `03-selected-work/01-project-one`, `02-project-two`, `03-project-three` — stock 9:16 cover +
  video clip each, placeholder brief/approach/system/result text
- `04-reels/01-*`, `02-*`, `03-*` — 3 vertical stock clips, filenames following the
  `NN-EventName-Year-description` pattern (not tagged — `ReelItem` has no meta.json support,
  lower stakes than a full case study, but still not real)
- `08-campaigns/01-new-year` (3 editions), `02-ramadan` (1 edition), `03-eid-fitr` (flat,
  single edition) — stock photo carousels, see below

Replace the media (and delete the `stockPlaceholder` line, or set it `false`) as real work lands.

## Round 5 — your feedback

- **Selected Work timing actually fixed this time.** Round 4's "+0.5 page" fix only padded
  the section's *height* — the per-slide window math inside `Slide` still divided 0..1 into
  exactly `total` equal pieces, so the last slide's entrance still mathematically *had* to
  end exactly at v=1 (when the pin releases) no matter how tall the container was; padding
  height alone doesn't move where a fraction lands. Fixed for real this time: `windowTotal =
  total + 0.5` is now used for every fraction, so the last slide finishes entering *before*
  v=1, leaving genuine dwell room. Also fixed the recede timing, which for slide 1 started
  the instant *its own* window began (v=0) instead of when slide 2 actually starts covering
  it — that's why the first project looked static/stuck: it was already dimming almost
  imperceptibly for the entire first page instead of just sitting there, and by round 4's
  math the *third* project's window still ended exactly at the section's edge. The last
  slide now also gets no recede window at all, since nothing ever covers it.
- **Ticker direction bug fixed.** This was the actual cause of "logos cornered on the left" —
  `Ticker.tsx` computed `next = x.get() - dx`, which double-flips the sign `dir` already
  carries. With the default direction, x was *increasing* every frame, immediately tripping
  the wrap condition and snapping back before the content had traveled anywhere close to a
  full loop — logos jittered near the left edge and "popped" instead of scrolling. Fixed to
  `x.get() + dx`; it's now a normal continuous marquee, content exits left and the next copy
  is revealed from the right, exactly your `[1]|[2]|[3]|[4]|[empty]|[1]|[2]|[3]|[4]` diagram.
- **About: credit list replaced with an actual brief.** "Design / Animation / 3D /
  Compositing / Editing — all Haitham Mohamed" read exactly as redundant as it sounds.
  Replaced with a real paragraph (`COPY.whatIDo` in `lib/placeholders.ts`) condensed from
  your own "Value I Bring" copy in `base 44.md`, not invented from scratch.

## Round 4 — your feedback

- **Hydration mismatch fixed.** `components/media/LazyVideo.tsx` was reading
  `typeof window !== "undefined" && prefersReducedMotion()` directly in the render body —
  on the server `window` doesn't exist so this is always `false` there, but on the client's
  first render it's evaluated for real, so a visitor with "reduce motion" on could get a
  server/client mismatch. Moved to `useState` + `useEffect`, the same safe pattern already
  used in Reels/Cursor. If the console warning still shows up after this, it'll now include
  a diff naming the exact element — paste that and I can find the rest in one pass instead of
  auditing the whole tree blind.
- **Reels: no more 3D flip.** A `rotateX` flip at full-phone-screen size reads as the whole
  device tilting, not a swipe happening inside it — switched to a flat 2D swipe (`y` translate,
  clipped by the screen's own overflow, nothing ever visually leaves the phone's bounds).
- **Reels + Selected Work: the last item now actually holds.** Every panel/reel's scroll
  window was already an equal fraction of the track, but the pin released the instant the
  last one's entrance finished — no dwell time before you're scrolled into the next section.
  Both sections now get +0.5 "page" of extra scroll room, so the final item holds for a beat
  like every other one does, instead of appearing to swipe away immediately.
- **Toolkit: back to the animated ticker.** The static grid from round 3 read as flat, and
  rows with only 3-4 tools left big empty gaps under `justify-between`. Reverted to the
  auto-scrolling marquee, icons at 1.5x size, and added enough tools per row (5-8 now) that
  the loop doesn't feel sparse: Video +CapCut/Media Encoder, VFX +Mocha Pro, Design +Procreate,
  AI Creative +Sora/Pika/ElevenLabs/Suno.
- **Real contact info**: `ihisam@outlook.com` and `+971 50 370 6142`, both in `SITE` now,
  wired into the footer, overlay menu, and the merged About+Booking contact block.

## Round 3 — your feedback

- **File naming convention.** Numbered files can now encode structured info in the name itself:
  `NN-EventName-Year-Long free-text description.ext` (e.g.
  `01-Ramadan-2025-a project about something something.mp4`). `lib/content.ts`'s
  `parseEventFilename()` parses this for Reels specifically (no meta.json there); anything
  that doesn't match the pattern just falls back to a plain title, so old-style filenames
  still work everywhere.
- **Hero zoom increased.** The load-in scale was the reference site's original subtle 6% —
  bumped to 22% (`lib/motion.ts`'s `zoom` tokens) so the parallax settle actually reads instead
  of being nearly invisible.
- **Selected Work: fixed the dead black section.** The very first panel had its own slide-up
  window mapped to the section's first scroll page, so you scrolled through ~110vh of nothing
  before slide 1 ever appeared. Slide 0 now starts already at rest (its window is pre-elapsed)
  — the stack begins the moment the section pins.
- **Selected Work: proper 9:16 treatment.** Since your work is vertical, a `"9:16"` project
  (the default now, `meta.json`'s `"ratio"` opts a project into `"16:9"` instead) renders as a
  framed vertical video centered in the horizontal panel, backed by a blurred/zoomed/50%-darkened
  still of the same footage filling the rest of the frame — not the video stretched full-bleed.
  The blurred backdrop is always a still image, never a second video decode, and only the
  currently-active panel's foreground actually plays video — every other panel (not yet
  reached, or already covered) shows its poster instead. Same treatment on `/work/[slug]`.
- **Reels: real flip, not push.** Swapped the vertical push/swipe from round 2 for a 3D
  rotateX flip-up — "very smooth, very simple," no scale/recede (that's Selected Work's
  mechanic, kept deliberately different here). Event name and description now flank the phone,
  parsed straight from the filename; there are 3 example reels now instead of 2.
- **Campaigns: click opens a modal.** Each edition card is now a button — click opens a
  fullscreen Instagram-post-style view (bigger media, title/description, prev/next through
  that edition's own carousel, Esc to close).
- **Toolkit: rebuilt as 4 static rows**, not a ticker. Categories are now Video / VFX / Design /
  AI Creative per your list (Sony Vegas, Particular, Syntheyes added — none are on Simple Icons,
  initials badges for all three). The old auto-scrolling marquee was clustering everything to
  the left when a row's content was narrower than the container; each row now just spreads its
  logos evenly across the full width (`justify-between`, wrapping on mobile).
- **About + Booking merged** into one section (`components/sections/07AboutBooking.tsx`) —
  portrait on the right (sticky while you scroll the left column on desktop), name/bio/credits/
  contact form all stacked on the left. The old pinned scroll-reveal on the credit list is gone
  since there's no longer a dedicated pinned panel for it — it's a plain staggered reveal now.

## Round 2 — your feedback

- **Hero background wired to your file.** You dropped in `01-hero/hero-background.jpg` — the
  documented stem was `background`, so `lib/content.ts`'s `getHero()` now checks both, no
  rename needed. It's full-bleed behind the whole pinned hero.
- **Selected Work rebuilt again** — the capture-view + click-thumbnail version from round 1
  wasn't what you wanted. It's now a real pinned scroll-stack: each project is a full-bleed
  panel that slides up from below (`y: 100%→0%`) as you scroll through its slice of the
  section, covering the previous one, which recedes slightly (scale + dim) underneath — the
  Apple/Webflow "each scroll brings up a new panel" pattern, driven purely by scroll position
  (no clicking required; `useTransform` naturally holds each panel at rest before/after its
  own scroll window). `components/sections/03SelectedWork.tsx`.
- **Campaigns restructured into groups + editions**, per your `## new year / [2025] -> [2024]
  -> [2023]` spec: a campaign is now a *group* (New Year, Ramadan) containing one *edition* per
  year, each with its own title/description/media, rendered as a connected arrow-sequence.
  `08-campaigns/01-new-year/01-2025/`, `02-2024/`, `03-2023/` is the shape; `02-ramadan/01-2026/`
  shows a group that only has one edition so far — add `02-2027/` etc. later and it appends to
  the sequence. A flat single-campaign shape (files straight in the group folder, no year
  subfolder — see `03-eid-fitr`) still works too, for a one-off with no year series.
  `lib/content.ts`'s `getCampaigns()` / `components/sections/Campaigns.tsx`.
- **Reels now actually swipe.** The scroll-driven active-reel change was cutting instantly
  before — now it's a real vertical swipe (`y` translate, next reel enters from below/exits
  above like actual Instagram Reels), both the outgoing and incoming reel animating at once.
  Direction is tracked with a ref rather than component state so it can't read a stale index
  from inside the scroll-event callback.
- **Reels moved before Campaigns** in page order, per your note.

## What's implemented

All of PLAN.md's build phases (1–6) plus most of Phase 7:

- Filesystem CMS (`lib/content.ts`), full `public/content/` tree with per-folder READMEs
- Motion tokens (`lib/motion.ts`) — the one easing curve, duration/stagger/zoom scale, load-cascade timing
- Lenis ↔ Framer Motion clock bridge (`components/chrome/LenisProvider.tsx`)
- Primitives: SplitText, Reveal, Ticker (with a `direction` prop for marquee banks), StickyStack,
  Parallax, CountUp, RecTimer, SectionHeader, LazyVideo, PosterImage, PhoneFrame, ViewfinderFrame,
  Lightbox, ToolkitLogo
- Chrome: sticky Header, fullscreen OverlayMenu, FrameHUD (scroll-linked frame counter), lerped Cursor
- Sections: Hero, Statement Band, Edited For, Stats, Selected Work (pinned slide-up stack),
  Reels (pinned, flip transitions), Campaigns (grouped editions, modal viewer), Process,
  Toolkit (static 4-row grid), About+Booking (merged), Footer
- Pinned scroll-capture on Hero, Selected Work, Reels — the Apple pattern from §5.1, never
  intercepting the wheel event (About's pin was dropped when it merged with Booking — a long
  form doesn't suit a pinned panel, so that reveal is a plain staggered one now)
- `/work` index, `/work/[slug]` case studies (static params from the content folders), `/privacy`, `/terms`
- Reduced-motion: `MotionConfig reducedMotion="user"` app-wide (collapses every whileInView/animate
  transition to instant), Lenis disabled, video autoplay replaced with poster + native controls,
  Ticker frozen, Reels swipe disabled — all gated at the primitive, not bolted on after
- Positioning changes from §2: motion-design toolkit (not the editor/colourist original), Rates
  → Process, no fabricated stats/testimonials (Reviews section stays hidden until a real quote exists)
- Real copy throughout from `base 44.md` (name "Haitham Mohamed," 12+ years, real email/LinkedIn/
  location) centralized in `lib/placeholders.ts`'s `SITE` object — not the borrowed Anamorph
  lines the first pass had accidentally used verbatim
- Your photo (`me.jpg`) is wired into the Hero floating card and About portrait

## Open items (yours)

1. **Real work.** Every video/case-study/campaign currently visible is free stock media + filler
   text (see "stockPlaceholder" above) — replace it before this goes in front of anyone at Fujairah.
2. **Favicon.** Still the default Next.js icon at `app/favicon.ico`.
3. Custom typeface: currently **Geist** (already wired via `next/font/google`, zero extra
   licensing/network risk) standing in for BDO Grotesk/General Sans/Neue Montreal/Satoshi — swap
   in `app/layout.tsx` if you license one of those instead.
4. **Not built:** the hidden Film Runner easter egg (PLAN §1 item 20) — explicitly the safest
   thing in the whole plan to cut, and it was cut here for the same reason.
5. I have no browser/screenshot tool in this environment — the 360/768/1440/1920 responsive
   pass and the actual motion feel (the slide-up stack, the reel swipe, the toolkit marquee)
   are unverified by eye. Look at it yourself on a real device before the interview.
