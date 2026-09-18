// The filesystem CMS. Server-only — reads `public/content/` from disk.
// Never import this from a "use client" component; import the resulting
// plain-data props into one instead.
//
// Contract (PLAN.md §4):
// - Order = numeric prefix, ascending.
// - Title = slug after the prefix, de-hyphenated, title-cased.
// - meta.json overrides anything derived.
// - Empty folder -> caller falls back to a placeholder. Never broken/blank.
// - Dev: fs reads happen per-request (no fetch-cache involved), so a file
//   dropped into public/content/ shows up on refresh with no restart.

import fs from "node:fs";
import path from "node:path";

export const CONTENT_ROOT = path.join(process.cwd(), "public", "content");

const NUMBERED = /^(\d+)-(.+)$/;
const VIDEO_EXT = [".mp4", ".webm", ".mov"];
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".avif"];

export interface OrderedEntry {
  order: number;
  slug: string;
  name: string; // full folder/file name including prefix
  fullPath: string;
  title: string;
}

function safeReaddir(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

export function deriveTitle(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function stripExt(filename: string): string {
  return filename.slice(0, filename.length - path.extname(filename).length);
}

/** Numbered subdirectories of `dir`, ascending by prefix. */
export function listNumberedDirs(dir: string): OrderedEntry[] {
  return safeReaddir(dir)
    .filter((d) => d.isDirectory())
    .map((d) => {
      const m = NUMBERED.exec(d.name);
      if (!m) return null;
      const slug = m[2];
      return {
        order: parseInt(m[1], 10),
        slug,
        name: d.name,
        fullPath: path.join(dir, d.name),
        title: deriveTitle(slug),
      };
    })
    .filter((v): v is OrderedEntry => v !== null)
    .sort((a, b) => a.order - b.order);
}

/** Numbered files directly inside `dir`, ascending by prefix. */
export function listNumberedFiles(dir: string): OrderedEntry[] {
  return safeReaddir(dir)
    .filter((d) => d.isFile())
    .map((d) => {
      const stem = stripExt(d.name);
      const m = NUMBERED.exec(stem);
      if (!m) return null;
      const slug = m[2];
      return {
        order: parseInt(m[1], 10),
        slug,
        name: d.name,
        fullPath: path.join(dir, d.name),
        title: deriveTitle(slug),
      };
    })
    .filter((v): v is OrderedEntry => v !== null)
    .sort((a, b) => a.order - b.order);
}

// When set, media URLs point at Supabase Storage's public bucket instead of
// Vercel's own static hosting — set it to
// "https://<project-ref>.supabase.co/storage/v1/object/public" (bucket name
// "content" is what completes the path; run
// scripts/sync-content-to-supabase.mjs to mirror public/content/ into it).
// Unset (local dev, or before you've synced) falls back to the local
// /content/... path exactly as before — nothing changes until this is set.
const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";

/** Public URL for a path under public/content. */
export function toPublicUrl(fullPath: string): string {
  const rel = path.relative(path.join(process.cwd(), "public"), fullPath);
  const relUrl = "/" + rel.split(path.sep).join("/");
  return MEDIA_BASE_URL ? MEDIA_BASE_URL + relUrl : relUrl;
}

export function readMetaJson(dir: string): Record<string, unknown> {
  const p = path.join(dir, "meta.json");
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** "First file wins" — first matching extension found, by directory read order. */
export function findFirstMedia(
  dir: string,
  stem: string | null,
  extensions: string[],
): string | null {
  const entries = safeReaddir(dir).filter((d) => d.isFile());
  for (const e of entries) {
    const ext = path.extname(e.name).toLowerCase();
    if (!extensions.includes(ext)) continue;
    if (stem && stripExt(e.name) !== stem) continue;
    return path.join(dir, e.name);
  }
  return null;
}

/** Poster pairing: <stem>.jpg|png|webp next to <stem>.mp4. */
export function findPosterFor(videoFullPath: string): string | null {
  const dir = path.dirname(videoFullPath);
  const stem = stripExt(path.basename(videoFullPath));
  return findFirstMedia(dir, stem, IMAGE_EXT);
}

export interface MediaRef {
  src: string;
  poster: string | null;
  kind: "video" | "image";
}

function mediaRefFromDir(dir: string, stem: string | null = null): MediaRef | null {
  const video = findFirstMedia(dir, stem, VIDEO_EXT);
  if (video) {
    return { src: toPublicUrl(video), poster: findPosterFor(video) ? toPublicUrl(findPosterFor(video)!) : null, kind: "video" };
  }
  const image = findFirstMedia(dir, stem, IMAGE_EXT);
  if (image) {
    return { src: toPublicUrl(image), poster: null, kind: "image" };
  }
  return null;
}

// ---------------------------------------------------------------------
// Section 01 — Hero
// ---------------------------------------------------------------------
export interface HeroContent {
  background: MediaRef | null;
  portrait: string | null;
}

export function getHero(): HeroContent {
  const dir = path.join(CONTENT_ROOT, "01-hero");
  // "background" is the documented stem; "hero-background" accepted too since
  // that's what actually got dropped in — no reason to make you rename it.
  const background = mediaRefFromDir(dir, "background") ?? mediaRefFromDir(dir, "hero-background");
  const portraitPath = findFirstMedia(dir, "portrait", IMAGE_EXT);
  return { background, portrait: portraitPath ? toPublicUrl(portraitPath) : null };
}

// ---------------------------------------------------------------------
// Section 02 — Edited For (logo ticker, hide-when-empty)
// ---------------------------------------------------------------------
export interface LogoItem {
  slug: string;
  title: string;
  src: string;
}

export function getEditedFor(): LogoItem[] {
  const dir = path.join(CONTENT_ROOT, "02-edited-for");
  return listNumberedFiles(dir)
    .filter((f) => IMAGE_EXT.includes(path.extname(f.fullPath).toLowerCase()))
    .map((f) => ({ slug: f.slug, title: f.title, src: toPublicUrl(f.fullPath) }));
}

// ---------------------------------------------------------------------
// Section 03 — Selected Work
// ---------------------------------------------------------------------
export interface WorkProject {
  slug: string;
  order: number;
  title: string;
  client: string;
  type: string;
  year: string;
  role: string;
  category: string;
  annotation: string;
  ratio: "16:9" | "9:16";
  cover: MediaRef | null;
  master: MediaRef | null;
  stills: string[];
  brief: string;
  approach: string;
  system: string;
  result: string;
  /** Marks folders filled with free stock media rather than real work — dev-only UI reads this to tag them. */
  stockPlaceholder: boolean;
}

interface WorkMeta {
  title?: string;
  client?: string;
  type?: string;
  year?: string;
  role?: string;
  category?: string;
  annotation?: string;
  ratio?: "16:9" | "9:16";
  brief?: string;
  approach?: string;
  system?: string;
  result?: string;
  stockPlaceholder?: boolean;
}

export function getSelectedWork(): WorkProject[] {
  const dir = path.join(CONTENT_ROOT, "03-selected-work");
  return listNumberedDirs(dir).map((d) => {
    const meta = readMetaJson(d.fullPath) as WorkMeta;
    const cover = mediaRefFromDir(d.fullPath, "cover");
    const master = mediaRefFromDir(d.fullPath, "master");
    const stills = listNumberedFiles(d.fullPath)
      .filter((f) => IMAGE_EXT.includes(path.extname(f.fullPath).toLowerCase()))
      .filter((f) => f.slug !== "cover")
      .map((f) => toPublicUrl(f.fullPath));

    return {
      slug: d.slug,
      order: d.order,
      title: meta.title ?? d.title,
      client: meta.client ?? "Client TBC",
      type: meta.type ?? "Motion Design",
      year: meta.year ?? "2026",
      role: meta.role ?? "Motion Designer",
      category: meta.category ?? "Brand Motion",
      annotation: meta.annotation ?? "",
      ratio: meta.ratio ?? "9:16", // most of your work is vertical — 16:9 is the opt-in exception now
      cover,
      master,
      stills,
      brief: meta.brief ?? "",
      approach: meta.approach ?? "",
      system: meta.system ?? "",
      result: meta.result ?? "",
      stockPlaceholder: meta.stockPlaceholder === true,
    };
  });
}

export function getWorkProject(slug: string): WorkProject | null {
  return getSelectedWork().find((p) => p.slug === slug) ?? null;
}

// ---------------------------------------------------------------------
// Section 04 — Reels (9:16)
// ---------------------------------------------------------------------
export interface ReelItem {
  slug: string;
  order: number;
  title: string;
  event: string;
  year: string;
  description: string;
  src: string;
  poster: string | null;
}

/**
 * Filenames follow `NN-EventName-Year-Long free-text description.ext` —
 * e.g. "01-Ramadan-2025-a project about something something.mp4". Parses
 * the slug (already stripped of its numeric prefix and extension) into
 * those three parts. Anything that doesn't match the pattern (no 4-digit
 * year segment) falls back to using the whole de-hyphenated slug as the
 * title, with empty event/description — old-style filenames still work.
 */
function parseEventFilename(slug: string, fallbackTitle: string): { event: string; year: string; description: string } {
  const match = /^([^-]+)-(\d{4})-(.+)$/.exec(slug);
  if (!match) return { event: fallbackTitle, year: "", description: "" };
  return { event: deriveTitle(match[1]), year: match[2], description: match[3] };
}

export function getReels(): ReelItem[] {
  const dir = path.join(CONTENT_ROOT, "04-reels");
  const files = listNumberedFiles(dir).filter((f) =>
    VIDEO_EXT.includes(path.extname(f.fullPath).toLowerCase()),
  );
  return files.map((f) => {
    const poster = findPosterFor(f.fullPath);
    const { event, year, description } = parseEventFilename(f.slug, f.title);
    return {
      slug: f.slug,
      order: f.order,
      title: f.title,
      event,
      year,
      description,
      src: toPublicUrl(f.fullPath),
      poster: poster ? toPublicUrl(poster) : null,
    };
  });
}

// ---------------------------------------------------------------------
// Simple — an Instagram-post-grid gallery. One big featured "post" up top;
// clicking a grid thumbnail below swaps what plays in the featured post,
// in place (no modal). Deliberately minimal: no event/year parsing, no
// meta.json, just numbered video files.
// ---------------------------------------------------------------------
export interface SimpleItem {
  slug: string;
  order: number;
  title: string;
  src: string;
  poster: string | null;
}

export function getSimple(): SimpleItem[] {
  const dir = path.join(CONTENT_ROOT, "09-simple");
  const files = listNumberedFiles(dir).filter((f) => VIDEO_EXT.includes(path.extname(f.fullPath).toLowerCase()));
  return files.map((f) => {
    const poster = findPosterFor(f.fullPath);
    return {
      slug: f.slug,
      order: f.order,
      title: f.title,
      src: toPublicUrl(f.fullPath),
      poster: poster ? toPublicUrl(poster) : null,
    };
  });
}

// ---------------------------------------------------------------------
// Campaigns — a group (e.g. "New Year", "Ramadan") containing one edition
// per recurrence (2025, 2024, 2023, ...), each with its own title,
// description and media carousel, shown as a connected year sequence
// ([2025] -> [2024] -> [2023]). Two folder shapes both work:
//
//   08-campaigns/01-new-year/01-2025/   <- numbered subfolders = editions
//                            02-2024/
//                            03-2023/
//   08-campaigns/03-eid-fitr/01-still.jpg, 02-still.jpg, meta.json
//                                        <- files directly inside = a
//                                           single implicit edition, for a
//                                           one-off campaign with no year
//                                           sequence yet
//
// A group folder with no editions in either shape is skipped entirely —
// hide-when-empty, same as everywhere else.
// ---------------------------------------------------------------------
export interface CampaignEdition {
  slug: string;
  order: number;
  year: string;
  title: string;
  description: string;
  media: MediaRef[];
  stockPlaceholder: boolean;
}

export interface CampaignGroup {
  slug: string;
  order: number;
  title: string;
  editions: CampaignEdition[];
}

interface CampaignGroupMeta {
  title?: string;
}

interface CampaignEditionMeta {
  title?: string;
  description?: string;
  year?: string;
  stockPlaceholder?: boolean;
}

function collectMedia(dir: string, files: OrderedEntry[]): MediaRef[] {
  const mediaFiles = files.filter((f) => {
    const ext = path.extname(f.fullPath).toLowerCase();
    return VIDEO_EXT.includes(ext) || IMAGE_EXT.includes(ext);
  });

  // A poster image sharing a video's numeric prefix (same "stem") is that
  // video's poster, not its own slide — exclude it so it isn't
  // double-counted as a standalone image too.
  const videoFiles = mediaFiles.filter((f) => VIDEO_EXT.includes(path.extname(f.fullPath).toLowerCase()));
  const posterPaths = new Set(
    videoFiles.map((f) => findPosterFor(f.fullPath)).filter((p): p is string => p !== null),
  );

  return mediaFiles
    .filter((f) => !posterPaths.has(f.fullPath))
    .map((f) => {
      const ext = path.extname(f.fullPath).toLowerCase();
      if (VIDEO_EXT.includes(ext)) {
        const poster = findPosterFor(f.fullPath);
        return { src: toPublicUrl(f.fullPath), poster: poster ? toPublicUrl(poster) : null, kind: "video" as const };
      }
      return { src: toPublicUrl(f.fullPath), poster: null, kind: "image" as const };
    });
}

function buildEdition(dir: OrderedEntry): CampaignEdition {
  const meta = readMetaJson(dir.fullPath) as CampaignEditionMeta;
  const files = listNumberedFiles(dir.fullPath);
  return {
    slug: dir.slug,
    order: dir.order,
    year: meta.year ?? dir.slug,
    title: meta.title ?? dir.title,
    description: meta.description ?? "",
    media: collectMedia(dir.fullPath, files),
    stockPlaceholder: meta.stockPlaceholder === true,
  };
}

export function getCampaigns(): CampaignGroup[] {
  const dir = path.join(CONTENT_ROOT, "08-campaigns");
  return listNumberedDirs(dir)
    .map((groupDir) => {
      const groupMeta = readMetaJson(groupDir.fullPath) as CampaignGroupMeta;
      const editionDirs = listNumberedDirs(groupDir.fullPath);

      const editions =
        editionDirs.length > 0
          ? editionDirs.map(buildEdition)
          : // No numbered subfolders — treat the group's own files as one implicit edition.
            (() => {
              const media = collectMedia(groupDir.fullPath, listNumberedFiles(groupDir.fullPath));
              if (media.length === 0) return [];
              const soloMeta = groupMeta as CampaignEditionMeta;
              return [
                {
                  slug: groupDir.slug,
                  order: 1,
                  year: soloMeta.year ?? "",
                  title: soloMeta.title ?? groupDir.title,
                  description: soloMeta.description ?? "",
                  media,
                  stockPlaceholder: soloMeta.stockPlaceholder === true,
                },
              ];
            })();

      return {
        slug: groupDir.slug,
        order: groupDir.order,
        title: groupMeta.title ?? groupDir.title,
        editions,
      };
    })
    .filter((g) => g.editions.length > 0);
}

// ---------------------------------------------------------------------
// Section 07 — About
// ---------------------------------------------------------------------
export interface AboutContent {
  portrait: string | null;
  signature: string | null;
}

export function getAbout(): AboutContent {
  const dir = path.join(CONTENT_ROOT, "06-about");
  const portrait = findFirstMedia(dir, "portrait", IMAGE_EXT);
  const signature = findFirstMedia(dir, "signature", IMAGE_EXT);
  return {
    portrait: portrait ? toPublicUrl(portrait) : null,
    signature: signature ? toPublicUrl(signature) : null,
  };
}

// ---------------------------------------------------------------------
// Section — Reviews (hide-when-empty)
// ---------------------------------------------------------------------
export interface ReviewItem {
  slug: string;
  name: string;
  role?: string;
  quote: string;
}

export function getReviews(): ReviewItem[] {
  const dir = path.join(CONTENT_ROOT, "07-reviews");
  const files = listNumberedFiles(dir).filter((f) => f.fullPath.endsWith(".json"));
  const items: ReviewItem[] = [];
  for (const f of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(f.fullPath, "utf-8"));
      items.push({
        slug: f.slug,
        name: typeof raw.name === "string" ? raw.name : f.title,
        role: typeof raw.role === "string" ? raw.role : undefined,
        quote: typeof raw.quote === "string" ? raw.quote : "",
      });
    } catch {
      // malformed review json — skip it rather than breaking the section
    }
  }
  return items;
}
