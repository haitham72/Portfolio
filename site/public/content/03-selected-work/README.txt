03-SELECTED-WORK
================
One numbered subfolder per project. Numeric prefix = card order on the
homepage sticky stack and in /work.

01-project-name/
  meta.json    OPTIONAL. Overrides derived fields:
               { "title", "client", "type", "year", "role", "category",
                 "annotation", "ratio", "brief", "approach", "system", "result" }
  cover.jpg    Card poster, 16:9, WebP or JPG, <=200KB.
  master.mp4   16:9 hero video for the case-study page, 1920x1080 H.264,
               <=8MB, no audio track.
  01-still.jpg, 02-still.jpg, ...   Case-study body stills, ordered.

Folder title (used if meta.json has no "title") is derived from the slug
after the number: 01-doha-metro-titles -> "Doha Metro Titles".

Empty subfolder = the placeholder project card ("Selected Work — Untitled")
with a gradient placeholder in place of cover/master. It still occupies a
slot so the layout never shifts when real work drops in — remove the folder
entirely once you don't want the slot.
