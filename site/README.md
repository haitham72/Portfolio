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

**`/preview` is not a bypass path in `middleware.ts`** — it still goes through the full
auth/access check (only `/login` and `/auth/callback` skip it, since those must be reachable
before a session exists at all). This matters: it's what lets an approved user's browser get
redirected from `/preview` to `/` once you flip their `access` to true — without running the
check on `/preview` too, that redirect is unreachable and they'd refresh into `/preview` forever
no matter what you change in Supabase. Don't add `/preview` back to the bypass list.

**Setup** (all of this needs your own Supabase project + Google Cloud OAuth credentials — I have
no way to create either for you):

1. Supabase dashboard → SQL Editor → run `supabase/schema.sql` (fresh project) or
   `supabase/migration_001_boolean_access.sql` (if `users.access` is still the old text
   `'limited'/'allowed'` — check with `select data_type from information_schema.columns where
   table_name='users' and column_name='access'`; should say `boolean`).
2. Supabase dashboard → Settings → API → copy **Project URL**, **anon public** key, **service_role** key.
3. Google Cloud Console → APIs & Services → OAuth consent screen → **publish it** (not "Testing" —
   Testing mode only allows sign-in from accounts you manually list, which defeats open sign-in).
   Set **App name** here too — this is what Google's consent screen actually shows the visitor
   ("Sign in to continue to ___"); leave it on the Google Cloud project's own default name and
   that's what strangers see, not your brand. Then Credentials → Create OAuth client ID (Web
   application) → Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Supabase dashboard → Authentication → Providers → Google → paste the Client ID/Secret → Save.
5. Supabase dashboard → Authentication → URL Configuration → **Redirect URLs** → add
   `http://localhost:3000/auth/callback`. The app itself always asks for the *current* origin's
   callback (`signInWithOAuth`'s `redirectTo` in `app/login/page.tsx` uses
   `window.location.origin`, so it correctly requests `localhost:3000` when you sign in from
   local dev) — but Supabase checks that requested URL against this allow-list and silently
   falls back to the dashboard's **Site URL** (normally your production domain) for anything not
   on it. Skip this step and every local sign-in bounces you to production instead of staying on
   localhost, no matter what the code asks for — this isn't a code bug to chase.
6. Copy `.env.local.example` → `.env.local`, fill in the three Supabase values from step 2.
   `SUPABASE_SERVICE_ROLE_KEY` is server-only — read in `middleware.ts` alone, never in a
   `"use client"` file, never prefixed `NEXT_PUBLIC_`.
7. Same three vars (plus optional `RESEND_API_KEY`/`NOTIFY_EMAIL`, see below) on Vercel before deploying.
8. Restart `pnpm dev` (env vars only load at startup) and test: `/` → bounced to `/login` →
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

**Current content state:** all real work now — no `meta.json` in the tree is flagged
`"stockPlaceholder": true` anymore. `03-selected-work`'s 3 projects, `04-reels`, and all four
`08-campaigns` groups (Ramadan, National Day, Eid, UIUX) are real footage.

**Media can be served from Supabase Storage instead of bundled with the app** — set
`MEDIA_BASE_URL` (see `.env.local.example`) to
`https://<project-ref>.supabase.co/storage/v1/object/public` and every URL `lib/content.ts`
returns switches from the local `/content/...` path to that CDN, with no other code change
(`toPublicUrl()` is the single choke point every media URL flows through). Run
`node --env-file=.env.local scripts/sync-content-to-supabase.mjs` to mirror `public/content/`
into a public `content` bucket first (rerunnable — `upsert: true`, only uploads recognized media
extensions, skips `meta.json`/`README.txt`). Leave `MEDIA_BASE_URL` unset and nothing changes —
this is currently unset in both local dev and Vercel, so production still serves from its own
bundled `public/content/` as of this writing. Flipping it also needs `next.config.ts`'s
`images.remotePatterns` (already wildcarded to `*.supabase.co`, done) — that's only for
`next/image`, plain `<video>`/`<img>` tags don't need it.

## Architecture

- **Motion tokens** (`lib/motion.ts`) — one easing curve everywhere, duration/stagger/zoom
  scale, load-cascade timing. Hero's load-in zoom is 22% (bumped from the reference site's
  original 6% — the subtle version wasn't visible enough).
- **Sound** (`components/chrome/SoundProvider.tsx`) — global mute state, not per-video. Starts
  muted (hard browser requirement — autoplay-with-sound is blocked everywhere without a prior
  gesture, no code workaround exists) and auto-unmutes on the visitor's first click/tap/keypress.
  **Not** mouse-wheel scroll — deliberately excluded, browsers don't treat it as a strong enough
  gesture for unmuting already-playing media; including it was the cause of an earlier
  "have to toggle sound off/on myself to hear it" bug. `SoundPrompt` shows an unmissable,
  self-dismissing "tap for sound" button (a real `onClick`, not a passthrough banner) for anyone
  who only scrolls and never taps anything else. `claimExclusiveSound()` fires whenever a video
  becomes the visible one (LazyVideo's and Reels' own IntersectionObserver callbacks) — mutes
  every other sound-managed video and explicitly re-asserts its own mute state against a
  module-level `currentlyMuted` value, rather than trusting whatever its own prop/attribute
  already said. Manual toggle lives in `FrameHUD` (icon-only below the `sm:` breakpoint — full
  text label plus the FRAME counter don't fit a phone's width). `LazyVideo` takes a `forceMuted`
  prop for cases that should never respect the toggle (Campaigns' grid previews — several can be
  near-visible at once, and letting them all compete for audio, or compete with the modal's
  audio, was the actual bug behind "sound plays over everything"). **Every autoplay path is
  muted-first**: `video.muted = true` then `.play()`, and only once that resolves does
  `claimExclusiveSound()` try to turn sound on — mobile browsers reject an out-of-gesture unmute
  by silently pausing the video, so if `video.paused` is still true right after, the code forces
  it back to muted+playing and calls `restoreSoundOnNextGesture()` to re-arm sound on the
  visitor's next tap. Playback always wins over sound; a video must never end up stuck paused
  just because sound couldn't be turned on. `<video>` elements themselves render `muted` as a
  hardcoded JSX attribute everywhere — the imperative sequence above is the only thing that ever
  flips it, so a React-driven `muted={someState}` prop can't race it and re-trigger the
  autoplay-block in the first place.
- **`LazyVideo`** (`components/media/LazyVideo.tsx`) — the one video primitive almost everything
  uses: single IntersectionObserver per instance handles both lazy-loading and play/pause-on-visibility
  in one effect (a two-effect version had a render-cycle gap between "entered view" and "actually
  starts playing" — consolidated). Reels (`04Reels.tsx`) uses a raw `<video>` instead because of
  its swipe-transition timing, so it has its own separate visibility-pause effect — if audio/playback
  bugs show up again, check both places, they don't share the fix automatically. **Reels' video
  ref is a per-slug callback cached in a `Map`, not a bare `setVideoNode`** — `AnimatePresence`
  keeps the outgoing slide's `<video>` mounted for its whole exit transition, so it unmounts
  *after* the incoming slide's video has already attached; a single shared ref callback meant
  that late unmount's `ref(null)` call stomped the already-current video's state right out from
  under it, which is why the second reel used to play once and then permanently stop, and the
  play button on it did nothing (`videoNode` was `null`). A detaching video's own callback now
  only nulls state if it's still the node state actually points at.
- **Pinned scroll sections** (Hero, Selected Work, Reels) — sticky child inside a tall outer
  track, `useScroll`/`useTransform` map scroll progress to visual state, never touching the wheel
  event directly. Selected Work's panels follow an explicit **enter → dwell → recede** sequence
  per slide (`components/sections/03SelectedWork.tsx`'s `Slide` — read its comment before
  changing the timing math, the segment-counting is easy to get subtly wrong and has been wrong
  twice already in ways that only showed up as "the middle one has no pause").
- **`LenisProvider` forces scroll to (0,0) on every fresh mount**, in a `useLayoutEffect` (before
  paint) rather than a plain `useEffect`, and sets `history.scrollRestoration = "manual"`. Every
  nav link (`Header`, `Footer`, `FrameHUD`'s Play, the overlay menu) points at an in-page hash
  like `#reels` — Lenis's `anchors: true` option smooth-scrolls to it on click, which is correct,
  but it also leaves that hash sitting in the URL. Revisit or reload a URL with `#reels` on it
  and the *browser's own* native behavior jumps straight there before React hydrates, bypassing
  every scroll-jacking hook in this app entirely — that was a real bug ("site starts at Reels
  instead of Hero," most videos never autoplaying since Hero/Selected Work above the landing
  point never got their scroll-into-view trigger). These pinned sections only make sense entered
  from the top; don't remove this reset to "fix" a perceived jump/flash on load — that's the
  correction happening, not a bug. This is now defended in three places, since a single
  `useEffect` reset alone still lost the race against the browser's own hash-jump: (1)
  `app/layout.tsx` has a `beforeInteractive` inline script that strips a hash from the URL before
  `<body>` is even parsed — before the target element exists for the browser to jump to at all;
  (2) `LenisProvider`'s own reset also re-asserts `scrollTo(0,0)` on the next animation frame and
  on `load`, since late layout shifts (fonts, video metadata) can move scroll position after the
  first synchronous call; (3) a delegated `click` listener on any `a[href^="#"]` scrubs the hash
  back out of the URL right after Lenis's own smooth-scroll fires, so a hash from normal in-page
  navigation never survives into a future reload either.
- **`SplitText`** (`components/motion/SplitText.tsx`) splits into words first, characters within
  each word — not straight into characters. `.char-mask` spans are `display: inline-block` with
  no space between them, so a run of them reads as one unbreakable unit to the browser's line
  wrapper; splitting straight into characters with no word grouping let it break a line between
  *any* two characters, including mid-word (a real phone screenshot showed "Haitham Moh|amed").
  If you ever see a mid-word break again, this is the first place to check.
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
  `ihisam@outlook.com`, `+971 50 370 6142`, `linkedin.com/in/haitham72`, Dubai UAE.
- Reduced-motion is handled at the primitive level everywhere (`MotionConfig reducedMotion="user"`
  app-wide, Lenis disabled, video autoplay replaced with poster + native controls, Ticker frozen),
  not bolted on as an afterthought.

## Deployment — two repos, know which one Vercel actually reads

This app lives in two places: this monorepo (`Fujeira hiring/site/`, day-to-day editing) and a
standalone `haitham72/Portfolio` GitHub repo (root = this folder's contents, `site/` nested one
level in, produced via `git subtree split -P "Fujeira hiring" -b fujeira-export`). **Vercel's
"portfolio" project deploys from the standalone Portfolio repo, not this monorepo.** Pushing here
alone does nothing for the live site — it already caused a real "why hasn't anything changed"
session once. To actually update the deployed site:

```bash
git branch -D fujeira-export                              # from the monorepo root
git subtree split -P "Fujeira hiring" -b fujeira-export
git push https://github.com/haitham72/Portfolio.git fujeira-export:main
```

Check it's a clean fast-forward first (`git merge-base --is-ancestor <portfolio's current main sha> fujeira-export`)
before pushing — it always has been so far, since Portfolio's `main` is only ever written to by
this exact command.

## Known gaps / open items

1. **Favicon** is still the default Next.js icon.
2. **Typeface** is Geist (already wired, zero licensing/network risk) standing in for BDO
   Grotesk/General Sans/Neue Montreal/Satoshi — swap in `app/layout.tsx` if you license one.
3. **Not built:** the hidden Film Runner easter egg from the original plan (explicitly the
   safest thing in it to cut).
4. **No browser/device automation available to me** — I can't drive an actual browser or phone
   myself. I can read screenshots you send (and have — that's how several mobile-only bugs in
   this file got found and fixed), verify route status codes, and reason about layout from the
   component code, but an actual look at motion feel or a live render is on you.
