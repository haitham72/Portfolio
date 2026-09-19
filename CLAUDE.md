# CLAUDE.md — Fujeira hiring

Routing only. Current state lives in `site/README.md` — read that first, always, before
touching code. This file exists so a fresh session doesn't have to re-derive the traps below.

## What this is

A motion-design portfolio site (Next.js 15) built for a Fujairah job interview, gated behind
Google sign-in via Supabase. The build spec/design system is `PLAN.md` (colors, type scale,
easing, section-by-section behavior) — read it for *why* something looks the way it does;
`site/README.md` for *what's currently built and working*. History lives in `git log`, not here
or in the README — don't append session narratives to either.

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
├── PLAN.md            # design spec / build plan — the "why"
├── me.jpg              # user's photo, already wired into Hero + About
└── site/               # the actual Next.js app — README.md here has full current state
    ├── README.md
    ├── stop-dev.ps1
    ├── supabase/        # schema.sql + migrations (users + visits tables)
    └── .env.local.example
```

## Doc discipline

Same rule as the rest of this workspace: each doc has one job. `PLAN.md` = spec. `README.md` =
current state (replace stale text when things change, don't append a changelog). `git log` =
history. If you're about to write "Round N — fixed X," that's a commit message, not a README
paragraph.
