08-CAMPAIGNS
============
Each numbered folder here is a campaign GROUP (New Year, Ramadan, Eid,
National Day, whatever recurs) shown on the site as a connected sequence of
editions: [2025] -> [2024] -> [2023]. Two folder shapes both work:

01-new-year/                 <- group folder, numeric prefix = display order
  meta.json                  OPTIONAL. { "title": "New Year" }
  01-2025/                   <- edition folder, numeric prefix = order
                                 (newest first is the usual convention —
                                 01 = most recent — but nothing enforces it)
    meta.json                OPTIONAL. { "title", "description", "year"
                              (defaults to the folder name, e.g. "2025"),
                              "stockPlaceholder": true|false }
    01-*.jpg / 01-*.mp4, 02-*, ...   every numbered file = one slide of
                              THAT edition's own carousel. Mix images/video
                              freely; a poster sharing a video's number
                              (01-clip.mp4 + 01-clip.jpg) pairs as its
                              poster, not a separate slide.
  02-2024/, 03-2023/, ...     more editions, same shape

02-ramadan/
  01-2026/                   a group can start with just one edition —
                              more get appended left-to-right as you add
                              02-2027/, 03-2028/, etc.

03-eid-fitr/                 OR skip the year structure entirely for a
  meta.json                  one-off: files straight inside the group
  01-*.jpg, 02-*.jpg          folder become a single implicit edition using
                              the group's own meta.json (still supports
                              "title" / "description" / "stockPlaceholder").

A group with no editions in either shape is skipped — hide-when-empty, same
as everywhere else. Three examples are seeded now (01-new-year with three
editions, 02-ramadan with one, 03-eid-fitr flat) filled with free stock
photos, all tagged "stockPlaceholder": true — that shows a small red "Stock
placeholder" tag in dev mode. Replace the media (and delete that meta.json
line, or set it false) as real work lands. Delete a folder entirely if you
don't want that campaign.

Media spec: same as Selected Work — 16:9 stills/clips ≤8MB video / ≤200KB
image, or match whatever aspect ratio you shoot in; the card itself is a
4:5 crop (object-cover), so anything reasonably close works.
