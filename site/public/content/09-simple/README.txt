09-SIMPLE
=========
Instagram-post-grid gallery — a big featured post up top, a grid of
smaller posts below. Click a grid item and it replaces what's playing in
the featured post above (no modal, deliberately the simplest of the
gallery sections).

01-name.mp4   Square (1:1) video, <=6MB, no audio track (autoplay muted).
01-name.jpg   Poster — same stem, auto-paired. WebP or JPG, <=200KB.

Numeric prefix = grid order. The name after the number must be UNIQUE across
files in this folder — it becomes each item's React key, and two files
named e.g. 01-post.mp4 / 02-post.mp4 both reduce to the same "post" slug,
which breaks the grid (duplicate-key warning, items can visually duplicate
or vanish). Two placeholder clips are seeded now (01-post-one, 02-post-two)
purely so the gallery isn't empty — swap them for real square-crop video
whenever ready, keeping names distinct. Empty folder = section hides entirely.
