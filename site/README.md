# HaithamMotion — Portfolio Site

Next.js 15 (App Router) + TypeScript + Tailwind v4 + `motion` + `lenis` + Supabase (auth + a
`users` table). Built per `../PLAN.md`; the design system there (colors, type scale, easing
curve, motion tokens) is the source of truth for *why* things look the way they do — this file
covers what's built and how to run it.

Package manager is **pnpm** — this machine's global npm config restricts install scripts to pnpm
only (`allow-scripts=pnpm` in the user `.npmrc`), so plain `npm install` fails here by design.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build + typecheck + lint
```

**Before editing files directly (renaming, moving, deleting under `public/content/` especially),
stop the dev server first** — Windows locks files that Next's file watcher is holding open, and
you'll get blocked with no clear reason why. Run `.\stop-dev.ps1` (from `site/`) to kill the dev
server and any leftover worker processes in one shot, or just Ctrl+C the terminal it's running in.

If `pnpm dev` throws a webpack "module is not a function" / React Client Manifest error after a
long hot-reload session, it's stale `.next` HMR state, not a code bug — stop the server,
`rm -rf .next`, restart.

## The site is gated — nothing is public

Every route requires Google sign-in. New sign-ins land with `access = false` in Supabase's
`public.users` table and get shown `/preview` (a small standalone gallery, not the real site,
and not obviously flagged as "reduced" — it just looks like its own thing). Nothing here
mentions that a fuller site exists behind it. **You approve access by hand**: Supabase dashboard
→ Table Editor → `users` → check the `access` box for that email. There's deliberately no
in-app admin UI for this.

**Setup** (all of this needs your own Supabase project + Google Cloud OAuth credentials — I have
no way to create either for you):

1. Supabase dashboard → SQL Editor → run `supabase/schema.sql` (fresh project) or
   `supabase/migration_001_boolean_access.sql` (if `users.access` is still the old text
   `'limited'/'allowed'` — check with `select data_type from information_schema.columns where
   table_name='users' and column_name='access'`; should say `boolean`).
2. Supabase dashboard → Settings → API → copy **Project URL**, **anon public** key, **service_role** key.
3. Google Cloud Console → APIs & Services → OAuth consent screen → **publish it** (not "Testing" —
   Testing mode only allows sign-in from accounts you manually list, which defeats open sign-in).
   Then Credentials → Create OAuth client ID (Web application) → Authorized redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Supabase dashboard → Authentication → Providers → Google → paste the Client ID/Secret → Save.
5. Copy `.env.local.example` → `.env.local`, fill in the three Supabase values from step 2.
   `SUPABASE_SERVICE_ROLE_KEY` is server-only — read in `middleware.ts` alone, never in a
   `"use client"` file, never prefixed `NEXT_PUBLIC_`.
6. Same three vars (plus optional `RESEND_API_KEY`/`NOTIFY_EMAIL`, see below) on Vercel before deploying.
7. Restart `pnpm dev` (env vars only load at startup) and test: `/` → bounced to `/login` →
   sign in → `/preview`. Flip your row to `access = true` in Supabase, refresh → the real site.

Fails loudly (500 — "Your project's URL and Key are required") if steps 1-5 aren't done, rather
than silently serving content ungated. That's intentional.

**Sign-in notifications (optional):** set `RESEND_API_KEY` (free tier at resend.com, no domain
verification needed — uses their default `onboarding@resend.dev` sender) and `NOTIFY_EMAIL` and
you'll get an email every time a new address signs in for the first time. Leave both blank and
this just silently no-ops.

**Default access for new sign-ups** is controlled by `DEFAULT_ACCESS` in `.env.local` (`middleware.ts`),
*not* the database column's default — the insert always passes an explicit value, so changing
the column default alone does nothing. Leave unset/`false` for real use (new sign-ups land on
`/preview`); set `DEFAULT_ACCESS=true` temporarily while testing so you're not hand-approving
your own throwaway accounts every time — restart the dev server after changing it.

Code: `middleware.ts` (the gate + notification logic), `app/login/`, `app/auth/callback/`,
`app/preview/`, `lib/supabase/browserClient.ts`, `supabase/*.sql`.

## Content — filesystem CMS, no code, no restart

Everything under `public/content/` is scanned by `lib/content.ts`. In dev it re-reads on every
request (drop a file, refresh — no restart); prod bakes it in at build time. Each
`public/content/*/README.txt` documents the exact naming pattern and media spec for that section.
Empty folders render a placeholder, never a broken layout — in dev, empty slots show a small
`PLACEHOLDER · ...` tag so you can see what's still missing.

| Folder | Section | Shape |
|---|---|---|
| `01-hero/` | Hero background + floating portrait | `background`/`hero-background` (video wins over image, same stem) + `portrait` |
| `02-edited-for/` | Client logo ticker | numbered logo files; hides entirely if empty |
| `03-selected-work/` | Pinned slide-up case studies | one numbered folder per project, `meta.json` for title/client/brief/etc., `ratio: "9:16"` is the default |
| `04-reels/` | Pinned phone-frame reels | filenames encode metadata: `NN-EventName-Year-description.mp4` — parsed, no `meta.json` |
| `08-campaigns/` | Grouped seasonal campaigns | group folder (e.g. `01-new-year/`) containing numbered edition folders (`01-2025/`, `02-2024/`) each with their own `meta.json`; OR files directly in the group folder for a flat one-off (see `03-eid-fitr`) |
| `09-simple/` | The `/preview` gallery ONLY | never appears on the real site — numbered video files, no `meta.json` |
| `05-services/`, `06-about/`, `07-reviews/` | Toolkit media (unused — Toolkit uses hardcoded logos now), About portrait, testimonials | `07-reviews` hides entirely if empty; no fabricated testimonials, ever |

**Current content state:** `03-selected-work`'s 3 projects and `08-campaigns` are still free stock
media (Picsum photos, trimmed public-domain Blender Foundation clips), each tagged
`"stockPlaceholder": true` in its `meta.json` — shows a small red badge in dev, invisible in
prod, but **not real work**. There are also several real videos sitting **unwired** directly in
`public/` (not under `public/content/`) — `ramadan - 2018/2019/2021/2023/2025.mp4`,
`national day - 2021.mp4`, `happy new year - 2019.mp4`, `rashed - 2021.mp4`,
`satelite - 2020.mp4`, `twins - 2023.mp4`, `Saudi National Day-2024 option 01.mp4` — none of
these are referenced by any section yet. The Ramadan set in particular maps naturally onto
`08-campaigns/02-ramadan/`'s edition-per-year structure.

## Architecture

- **Motion tokens** (`lib/motion.ts`) — one easing curve everywhere, duration/stagger/zoom
  scale, load-cascade timing. Hero's load-in zoom is 22% (bumped from the reference site's
  original 6% — the subtle version wasn't visible enough).
- **Sound** (`components/chrome/SoundProvider.tsx`) — global mute state, not per-video. Starts
  muted (hard browser requirement — autoplay-with-sound is blocked everywhere without a prior
  gesture) and auto-unmutes on the visitor's first scroll/click/keypress, so it *feels* on by
  default without breaking autoplay. Manual toggle lives in `FrameHUD`. `LazyVideo` takes a
  `forceMuted` prop for cases that should never respect the toggle (Campaigns' grid previews —
  several can be near-visible at once, and letting them all compete for audio, or compete with
  the modal's audio, was the actual bug behind "sound plays over everything").
- **`LazyVideo`** (`components/media/LazyVideo.tsx`) — the one video primitive almost everything
  uses: single IntersectionObserver per instance handles both lazy-loading and play/pause-on-visibility
  in one effect (a two-effect version had a render-cycle gap between "entered view" and "actually
  starts playing" — consolidated). Reels (`04Reels.tsx`) uses a raw `<video>` instead because of
  its swipe-transition timing, so it has its own separate visibility-pause effect — if audio/playback
  bugs show up again, check both places, they don't share the fix automatically.
- **Pinned scroll sections** (Hero, Selected Work, Reels) — sticky child inside a tall outer
  track, `useScroll`/`useTransform` map scroll progress to visual state, never touching the wheel
  event directly. Selected Work's panels follow an explicit **enter → dwell → recede** sequence
  per slide (`components/sections/03SelectedWork.tsx`'s `Slide` — read its comment before
  changing the timing math, the segment-counting is easy to get subtly wrong and has been wrong
  twice already in ways that only showed up as "the middle one has no pause").
- **Campaigns** (`lib/content.ts`'s `getCampaigns()` / `components/sections/Campaigns.tsx`) —
  group → editions model. Click opens an Instagram-post-style modal (Lightbox), unmuted,
  prev/next through that edition's own media.
- **Toolkit** (`components/sections/06Toolkit.tsx`) — 4 hardcoded categories (Video/VFX/Design/AI
  Creative) in `lib/placeholders.ts`'s `TOOLKIT`, animated marquee per row (`Ticker`, alternating
  direction). Real brand SVGs via `cdn.simpleicons.org` where that brand is actually listed there
  (about half the list isn't — every Adobe app, most AI tools — those get a 2-letter initials badge).
- **About+Booking merged** (`components/sections/07AboutBooking.tsx`) — portrait sticky on the
  right (desktop), name/bio/brief/contact-form stacked on the left. Not pinned (a form doesn't
  suit a scroll-jacked panel).
- **Contact info** — real, centralized in `lib/placeholders.ts`'s `SITE` object:
  `ihisam@outlook.com`, `+971 50 370 6142`, `linkedin.com/in/haithammohamed`, Dubai UAE.
- Reduced-motion is handled at the primitive level everywhere (`MotionConfig reducedMotion="user"`
  app-wide, Lenis disabled, video autoplay replaced with poster + native controls, Ticker frozen),
  not bolted on as an afterthought.

## Known gaps / open items

1. **Real work.** See "Current content state" above — replace stock media before anyone outside
   testing sees this.
2. **Favicon** is still the default Next.js icon.
3. **Typeface** is Geist (already wired, zero licensing/network risk) standing in for BDO
   Grotesk/General Sans/Neue Montreal/Satoshi — swap in `app/layout.tsx` if you license one.
4. **Not built:** the hidden Film Runner easter egg from the original plan (explicitly the
   safest thing in it to cut).
5. **No browser/screenshot tool available to me** — anything requiring an actual look (motion
   feel, responsive breakpoints, and now, everything behind the sign-in gate, since I can't
   authenticate as a real Google user) needs you to check directly. I can only verify route
   status codes and code-level logic, not rendered/gated content.
