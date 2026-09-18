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
// Run with: node --env-file=.env.local scripts/sync-content-to-supabase.mjs
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
// (the service role key is required to write to Storage; the anon key can't).

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const BUCKET = "content";
const ROOT = path.join(process.cwd(), "public", "content");

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local.");
  process.exit(1);
}
const supabase = createClient(url, key);

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
  await ensureBucket();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for await (const fullPath of walk(ROOT)) {
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      skipped++;
      continue;
    }

    const relPath = path.relative(ROOT, fullPath).split(path.sep).join("/");
    const buffer = await readFile(fullPath);
    const { size } = await stat(fullPath);

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

  console.log(`\n${uploaded} uploaded, ${skipped} skipped (non-media), ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
