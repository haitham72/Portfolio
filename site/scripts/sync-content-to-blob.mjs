// Mirrors public/content/ into a public Vercel Blob store, preserving the
// exact same relative paths under a "content/" prefix
// (content/01-hero/hero-background.mp4, content/08-campaigns/..., etc).
// That 1:1 path mapping is what lets lib/content.ts's toPublicUrl() just
// prefix a base URL onto its existing relative paths instead of a real
// rewrite — see MEDIA_BASE_URL in lib/content.ts.
//
// Why Blob and not the repo: committed media is copied into every retained
// deployment, and counted twice (static assets, plus traced into the function
// bundle because lib/content.ts reads the folder with fs). Blob is a separate
// product from deployment storage, so one copy stays one copy. See PLAN.md.
//
// meta.json / README.txt / dotfiles are intentionally NOT uploaded — they're
// local CMS metadata, never served as media.
//
// It also writes lib/content-manifest.json: the list of video filenames per
// folder. Video files are gitignored, so a deployed checkout has no .mp4 on
// disk at all — but the build still needs their NAMES to put a <video src> on
// the page. Regenerate and commit it whenever you add/remove/rename a video.
//
// Run with: node --env-file=.env.local scripts/sync-content-to-blob.mjs
//   ...or:  node scripts/sync-content-to-blob.mjs --manifest-only
//           (rewrites the manifest from local disk, uploads nothing, needs no
//            credentials and touches no network)
// Credentials: run `vercel env pull` to get BLOB_STORE_ID + VERCEL_OIDC_TOKEN
// into .env.local, or set a long-lived BLOB_READ_WRITE_TOKEN there. Either
// works; see the auth block below.

import { put } from "@vercel/blob";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const PREFIX = "content";
const ROOT = path.join(process.cwd(), "public", "content");
const MANIFEST_PATH = path.join(process.cwd(), "lib", "content-manifest.json");

const MANIFEST_ONLY = process.argv.includes("--manifest-only");
// Allows the manifest to shrink — see writeManifest().
const FORCE = process.argv.includes("--force");

// One year. Blob's CDN default is a month; these filenames are stable and the
// content behind them effectively never changes in place, so cache hard.
// The trade-off: if you REPLACE a video keeping the same filename, browsers
// that already fetched it can serve the old one for up to a year. Give the
// replacement a new filename instead — the manifest picks that up for free.
const CACHE_MAX_AGE = 31536000;

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

// Must stay in sync with VIDEO_EXT in lib/content.ts — these are the
// extensions that are gitignored and therefore need manifest entries.
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov"]);

// Two ways to authenticate, matching the SDK's own resolution order:
//   1. BLOB_READ_WRITE_TOKEN  — a long-lived token, for code outside Vercel.
//   2. BLOB_STORE_ID + VERCEL_OIDC_TOKEN — short-lived OIDC credentials that
//      `vercel env pull` writes; the SDK picks them up on its own, so we must
//      NOT pass `token` in that case.
// The OIDC token expires (hours, not days). If a rerun suddenly 401s, run
// `vercel env pull` again, or put a read-write token in .env.local instead.
const token = process.env.BLOB_READ_WRITE_TOKEN;
const hasOidc = Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
if (!MANIFEST_ONLY && !token && !hasOidc) {
  console.error(
    "No Blob credentials. Either set BLOB_READ_WRITE_TOKEN in .env.local, or run\n" +
      "`vercel env pull` and make sure BLOB_STORE_ID and VERCEL_OIDC_TOKEN are both there\n" +
      "(the store's connection must include the Development environment for that).",
  );
  process.exit(1);
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function main() {
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let empty = 0;
  const videos = {};
  let base = null;

  for await (const fullPath of walk(ROOT)) {
    const ext = path.extname(fullPath).toLowerCase();
    const relPath = path.relative(ROOT, fullPath).split(path.sep).join("/");
    const { size } = await stat(fullPath);

    // A 0-byte file is not real media (see the size guard below) — keep it
    // out of the manifest too, so a stray stub can't take a real video's
    // place in the listing.
    if (VIDEO_EXTS.has(ext) && size > 0) {
      const dir = path.posix.dirname(relPath);
      const key = dir === "." ? "" : dir;
      (videos[key] ??= []).push(path.posix.basename(relPath));
    }

    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      skipped++;
      continue;
    }

    // Size guard. Videos are gitignored, so a fresh clone has the folder
    // structure but none of the actual files — and anything that recreates
    // them as empty placeholders (a stub, a failed download, an interrupted
    // copy) would otherwise be uploaded straight over the real media, since
    // allowOverwrite below overwrites unconditionally. Never upload 0 bytes.
    if (size === 0) {
      console.log(`SKIPPED ${relPath} — 0 bytes on disk, refusing to overwrite the store with it.`);
      empty++;
      continue;
    }

    if (MANIFEST_ONLY) {
      skipped++;
      continue;
    }

    const body = await readFile(fullPath);
    process.stdout.write(`Uploading ${relPath} (${(size / 1024 / 1024).toFixed(1)} MB)... `);
    try {
      const blob = await put(`${PREFIX}/${relPath}`, body, {
        access: "public",
        ...(token ? { token } : {}), // otherwise the SDK uses the OIDC pair
        contentType,
        addRandomSuffix: false, // the whole point: the URL must match the path
        allowOverwrite: true, // rerunnable
        cacheControlMaxAge: CACHE_MAX_AGE,
        multipart: size > 100 * 1024 * 1024,
      });
      // Every blob in a store shares one origin, so whatever comes back first
      // gives us the base URL that MEDIA_BASE_URL needs.
      base ??= new URL(blob.url).origin;
      console.log("done");
      uploaded++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failed++;
    }
  }

  await writeManifest(videos);

  if (MANIFEST_ONLY) {
    console.log(`\nManifest only — nothing uploaded.`);
  } else {
    console.log(`\n${uploaded} uploaded, ${skipped} skipped (non-media), ${failed} failed.`);
    if (base) {
      console.log(`\nSet this in .env.local AND on Vercel (Production + Preview):\n  MEDIA_BASE_URL=${base}`);
    }
  }
  if (empty > 0) {
    console.error(`${empty} file(s) were 0 bytes and were NOT uploaded — check your local copy before rerunning.`);
  }
  if (failed > 0 || empty > 0) process.exit(1);
}

async function countExistingManifest() {
  try {
    const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
    return Object.values(raw.videos ?? {}).reduce((n, list) => n + list.length, 0);
  } catch {
    return 0; // no manifest yet, or unreadable — nothing to protect
  }
}

async function writeManifest(videos) {
  const total = Object.values(videos).reduce((n, list) => n + list.length, 0);
  const existing = await countExistingManifest();

  // Videos are gitignored, so a checkout without the media on disk finds
  // nothing to list. Writing that result would blank the manifest and empty
  // every video section on the site. Anything that SHRINKS the list is
  // treated the same way: an incomplete checkout is a far more likely
  // explanation than a deliberate deletion. Actually removing a video is the
  // case that needs --force.
  if (total < existing && !FORCE) {
    console.warn(
      `\nRefusing to rewrite ${path.basename(MANIFEST_PATH)}: found ${total} video(s) on disk, but the ` +
        `committed manifest lists ${existing}.\n` +
        `That usually means this checkout is missing media, not that videos were deleted.\n` +
        `If you really did remove ${existing - total}, rerun with --force.`,
    );
    return;
  }

  const sorted = {};
  for (const key of Object.keys(videos).sort()) {
    sorted[key] = videos[key].sort();
  }

  const payload = {
    _comment:
      "GENERATED by scripts/sync-content-to-blob.mjs — do not edit by hand. Video filenames per folder under public/content/, so the build can list videos that are gitignored and served from Vercel Blob. Regenerate with: node scripts/sync-content-to-blob.mjs --manifest-only",
    videos: sorted,
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${path.relative(process.cwd(), MANIFEST_PATH)} — ${total} video(s) in ${Object.keys(sorted).length} folder(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
