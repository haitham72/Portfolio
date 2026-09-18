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
- **The whole site is gated.** Nothing renders without Google sign-in (Supabase Auth + a
  `users` table you approve rows in manually). This means you can no longer `curl` the homepage
  and see real content — every route redirects to `/login` unless there's a valid session
  cookie. Verify route-level logic (status codes, redirects) via curl; verify actual rendered
  content by asking the user to check in a real signed-in browser, or by reading the component
  code directly.
- **Real work is still mostly stock placeholder.** Everything tagged `"stockPlaceholder": true`
  in a `meta.json` is free stock media standing in for the user's real work — check
  `site/README.md`'s "Current content state" section before assuming any given video/image is real.
  Several real videos also sit unwired directly in `site/public/` (not under `public/content/`)
  waiting to be sorted into the right content folders — same section covers this.

## Layout

```
Fujeira hiring/
├── CLAUDE.md          # this file
├── PLAN.md            # design spec / build plan — the "why"
├── OLD/               # reference material (Anamorph reference site save, prior Base44 build,
│                       #   original prompt drafts) — mine for real copy/facts, don't rebuild from it
├── me.jpg              # user's photo, already wired into Hero + About
└── site/               # the actual Next.js app — README.md here has full current state
    ├── README.md
    ├── stop-dev.ps1
    ├── supabase/        # schema.sql + migrations for the users table
    └── .env.local.example
```

## Doc discipline

Same rule as the rest of this workspace: each doc has one job. `PLAN.md` = spec. `README.md` =
current state (replace stale text when things change, don't append a changelog). `git log` =
history. If you're about to write "Round N — fixed X," that's a commit message, not a README
paragraph.
