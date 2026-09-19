# Media hosting — decision for the next iteration

The site is built. This file no longer holds the design spec; it holds one decision, so the
next person to touch media hosting doesn't re-derive it. The original 433-line build and
reliability plan (design system, autoplay lifecycle, iOS Safari matrix, section checklists)
is preserved in git: `git show 7b65ed9:PLAN.md`.

## Decision: use Vercel Blob, not Supabase Storage

Media lives in a Supabase Storage bucket today. If this is revisited, move it to **Vercel Blob**.

## Why media must not be committed to the repo at all

This is the constraint that matters, and it is independent of which host you pick.

Vercel charges Deployment Storage and Functions Storage in **GB-months** — it records the
maximum stored per project per billing day and sums those days across the billing period. Every
retained deployment keeps its own copy of the build output. So committed media is multiplied by
the number of retained deployments, and it is counted **twice**:

1. as static assets (Deployment Storage), and
2. inside the serverless function bundles (Functions Storage) — because `lib/content.ts` reads
   `public/content/` with `fs`, and Next's tracer can't tell which files that will touch, so it
   packs the entire directory into the bundle.

With 188 MB of media and ~38 retained deployments that reached 7.41 GB and 7.99 GB against a
10 GB allowance. Because the metric is an accumulating GB-month total, deleting deployments
stops further accrual but does **not** lower the number until the billing period resets.

## Why Vercel Blob over Supabase Storage

- **It is separate from Deployment Storage.** Vercel's own docs list Blob as a distinct product
  from deployment-linked output, so it does not multiply per deployment. That is the entire
  problem above, avoided.
- **Twice the free transfer.** Hobby includes 1 GB Blob storage + 10 GB Blob data transfer.
  Supabase's free tier is 1 GB storage + 5 GB egress.
- **Served from Vercel's own CDN**, on the platform the site already runs on — one less vendor,
  one less env var, one less place for the media to silently drift out of sync.
- **Supabase's objects currently return `Cache-Control: no-cache`**, so nothing caches at
  Cloudflare's edge and every view re-fetches from origin against that 5 GB. Fixable by
  re-uploading with a long cache lifetime, but it's a live gotcha as of this writing.

## What to keep regardless of host

These survived the move and should survive the next one:

- **The build needs media *names*, never bytes.** `lib/content-manifest.json` carries them and
  `safeReaddir()` merges it into real directory listings — one choke point, so every getter and
  `generateStaticParams` inherits it. Regenerate and commit it whenever a video changes.
- **`toPublicUrl()` is the single place a media URL is built.** Changing hosts should be an env
  var and a sync script, not a rewrite.
- **Keep poster/cover images tracked in git.** All 13 total 1.6 MB, and having them on disk is
  what lets stem-based poster pairing keep working off the real filesystem.
- **Guard any sync script that uses `upsert`.** Never upload a 0-byte file, and never let a
  manifest shrink without an explicit flag — a checkout legitimately missing media looks exactly
  like a deletion.
