# CLAUDE.md — Fujeira hiring

Routing only. Current state lives in `site/README.md` — read that first, always, before
touching code. This file exists so a fresh session doesn't have to re-derive the traps below.

## What this is

A motion-design portfolio site (Next.js 15) built for a Fujairah job interview, gated behind
Google sign-in via Supabase. The site is built and shipped. `site/README.md` is *what's currently
built and working* — read it first. `PLAN.md` used to be the build spec/design system (colors,
type scale, easing, section-by-section behavior); it has been reduced to a single forward-looking
media-hosting decision, and the original 433-line spec now lives only in git history
(`git show 7b65ed9:PLAN.md`) — go there for *why* something looks the way it does. History lives
in `git log`, not here or in the README — don't append session narratives to either.

## Before you do anything

- **Stop the dev server before editing files directly**, especially under `site/public/content/`.
  Windows locks files the running dev server's watcher holds open, and edits/renames/deletes get
  silently blocked with a confusing error. Run `site/stop-dev.ps1`, or Ctrl+C the terminal.
- **`pnpm` only, never `npm`.** This machine's global `.npmrc` restricts install scripts to pnpm;
  plain `npm install` fails by design, not a bug to route around.
- **The site is gated, with named exceptions.** Nothing renders without Google sign-in (Supabase
  Auth + a `users` table you approve rows in manually) — the homepage included. This means you
  can no longer `curl` the homepage and see real content — it redirects to `/login` unless there's
  a valid session cookie. Verify route-level logic (status codes, redirects) via curl; verify
  actual rendered content by asking the user to check in a real signed-in browser, or by reading
  the component code directly. Two things intentionally bypass this: `middleware.ts`'s
  `BYPASS_PATHS` (`/login`, `/auth/callback`, `/privacy`, `/terms` — the last two exist publicly
  for Google's OAuth consent screen requirements), and `PUBLIC_MODE=true` (an env var that drops
  the entire gate for everyone, meant as a temporary escape hatch for a specific high-stakes visit
  — see `site/README.md`). If a route unexpectedly returns real content with no redirect, check
  `PUBLIC_MODE` before assuming the gate broke.
- **Videos are NOT in git, and your local copies are the only backup.** Every `.mp4`/`.webm`/
  `.mov` under `site/public/content/` is gitignored (28 files, ~186 MB -- they were ~99% of the
  repo's bytes, and Vercel stored them twice per deployment: once as static assets, once inside
  the function bundles, because `lib/content.ts` reads the folder with `fs`). They live in a
  public **Vercel Blob** store (`portfolio-blob`), which is billed separately from deployment
  storage, and `MEDIA_BASE_URL` points every media URL there. **Never `git clean -x` or delete
  these files assuming git has them -- it doesn't.** The store and your disk are the only two
  copies. (They're also still in a Supabase `content` bucket from the previous setup; that's a
  stale copy, not a live dependency.)
- **Adding/renaming/removing a video needs a manifest regen.** The build discovers videos by
  *name* from `site/lib/content-manifest.json` (generated, committed); `safeReaddir()` in
  `lib/content.ts` merges it into real directory listings, so a deployed checkout with no `.mp4`
  on disk still renders them. After touching a video, run
  `node --env-file=.env.local scripts/sync-content-to-blob.mjs` (uploads + regenerates) or
  `node scripts/sync-content-to-blob.mjs --manifest-only` (regenerates only, no network), and
  **commit the manifest**. Forget this and the new video simply won't appear in production.
  Uploads carry a one-year `cache-control`, so *replace* a video by giving it a new filename
  rather than overwriting an existing one.
  Poster/cover images stay tracked on purpose -- 13 files, 1.6 MB -- so poster pairing still works
  off the real filesystem.
- **All content is real now** — no `meta.json` in the tree is flagged `"stockPlaceholder": true`
  anymore. If you see that flag anywhere, treat it as new/unexpected, not the norm.
- **One repo now.** This checkout's `origin` *is* `haitham72/Portfolio` on GitHub — the exact repo
  Vercel deploys from. A plain `git push origin main` from here goes live; there is no separate
  monorepo to sync from anymore and no subtree-split step. (An earlier version of this project did
  use a separate monorepo with a `git subtree split` dance to publish here — that's been dropped;
  if you find old references to it elsewhere, they're stale.)

## Layout

```text
./                      # repo root = this checkout's contents; origin = haitham72/Portfolio
├── CLAUDE.md          # this file
├── PLAN.md            # media-hosting decision for next time (was the design spec)
├── me.jpg              # user's photo, already wired into Hero + About
└── site/               # the actual Next.js app — README.md here has full current state
    ├── README.md
    ├── stop-dev.ps1
    ├── supabase/        # schema.sql + migrations (users + visits tables)
    └── .env.local.example
```

## Doc discipline

Same rule as the rest of this workspace: each doc has one job. `PLAN.md` = the media-hosting
decision. `README.md` =
current state (replace stale text when things change, don't append a changelog). `git log` =
history. If you're about to write "Round N — fixed X," that's a commit message, not a README
paragraph.
