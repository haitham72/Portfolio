// One-off/rerunnable sync: mirrors public/content/ into a public Supabase
// Storage bucket named "content", preserving the exact same relative paths
// (01-hero/hero-background.mp4, 08-campaigns/01-Ramadan/01-2026/..., etc).
// That 1:1 path mapping is what lets lib/content.ts's toPublicUrl() just
// prefix a base URL onto its existing relative paths instead of a real
// rewrite — see MEDIA_BASE_URL in lib/content.ts.
//
// meta.json / README.txt / dotfiles are intentionally NOT uploaded — they're
// local CMS metadata, never served as media.
//
// It also writes lib/content-manifest.json: the list of video filenames per
// folder. Video files are gitignored (they're 99% of the repo's bytes and
// live in the bucket now), so a Vercel checkout has no .mp4 on disk at all —
// but the build still needs their NAMES to put a <video src> on the page.
// That manifest is how the names get there; lib/content.ts merges it into
// its directory listings. Regenerate and commit it whenever you add, remove
// or rename a video.
//
// Run with: node --env-file=.env.local scripts/sync-content-to-supabase.mjs
//   ...or:  node scripts/sync-content-to-supabase.mjs --manifest-only
//           (rewrites the manifest from local disk, uploads nothing, needs
//            no credentials and touches no network)
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
// (the service role key is required to write to Storage; the anon key can't).

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "content";
const ROOT = path.join(process.cwd(), "public", "content");
const MANIFEST_PATH = path.join(process.cwd(), "lib", "content-manifest.json");

const MANIFEST_ONLY = process.argv.includes("--manifest-only");
// Allows the manifest to shrink -- see writeManifest().
const FORCE = process.argv.includes("--force");

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

let supabase = null;
if (!MANIFEST_ONLY) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local.");
    process.exit(1);
  }
  supabase = createClient(url, key);
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((b) => b.name === BUCKET)) return;
  console.log(`Creating public bucket "${BUCKET}"...`);
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw createError;
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
  if (!MANIFEST_ONLY) await ensureBucket();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let empty = 0;
  const videos = {};

  for await (const fullPath of walk(ROOT)) {
    const ext = path.extname(fullPath).toLowerCase();
    const relPath = path.relative(ROOT, fullPath).split(path.sep).join("/");
    const { size } = await stat(fullPath);

    // A 0-byte file is not real media (see the size guard below) -- keep it
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
    // upsert:true below overwrites unconditionally. Never upload 0 bytes.
    if (size === 0) {
      console.log(`SKIPPED ${relPath} — 0 bytes on disk, refusing to overwrite the bucket with it.`);
      empty++;
      continue;
    }

    if (MANIFEST_ONLY) {
      skipped++;
      continue;
    }

    const buffer = await readFile(fullPath);

    process.stdout.write(`Uploading ${relPath} (${(size / 1024 / 1024).toFixed(1)} MB)... `);
    const { error } = await supabase.storage.from(BUCKET).upload(relPath, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.log(`FAILED — ${error.message}`);
      failed++;
    } else {
      console.log("done");
      uploaded++;
    }
  }

  await writeManifest(videos);

  if (MANIFEST_ONLY) {
    console.log(`\nManifest only — nothing uploaded.`);
  } else {
    console.log(`\n${uploaded} uploaded, ${skipped} skipped (non-media), ${failed} failed.`);
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
    return 0; // no manifest yet, or unreadable -- nothing to protect
  }
}

async function writeManifest(videos) {
  const total = Object.values(videos).reduce((n, list) => n + list.length, 0);

  const existing = await countExistingManifest();

  // Videos are gitignored, so a checkout without the media on disk finds
  // nothing to list. Writing that result would blank the manifest and empty
  // every video section on the site. Anything that SHRINKS the list is
  // treated the same way: an incomplete checkout is a far more likely
  // explanation than a deliberate deletion. Actually removing a video is
  // the case that needs --force.
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
      "GENERATED by scripts/sync-content-to-supabase.mjs — do not edit by hand. Video filenames per folder under public/content/, so the build can list videos that are gitignored and served from Supabase Storage. Regenerate with: node scripts/sync-content-to-supabase.mjs --manifest-only",
    videos: sorted,
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${path.relative(process.cwd(), MANIFEST_PATH)} — ${total} video(s) in ${Object.keys(sorted).length} folder(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
