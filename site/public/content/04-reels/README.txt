04-REELS
========
9:16 vertical reels for the phone-frame section. Numeric prefix = order.

Filename pattern: NN-EventName-Year-Long free-text description.mp4
  e.g. 01-Ramadan-2025-a project about something something.mp4
This is parsed (no meta.json needed here) into three fields shown flanking
the phone: EventName | mobile view | description. Spaces are fine inside
the event name or the description — only the two hyphens right after the
number and right after the year matter. A filename with no 4-digit year
segment just falls back to using the whole name as a plain title.

01-name.jpg   Poster — same stem as the video, auto-paired. WebP or JPG,
              <=200KB. No poster -> #t=0.1 first-frame fallback.
01-name.mp4   1080x1920 H.264, <=6MB, no audio track (autoplay muted).

Empty -> section falls back to a single placeholder phone frame, does not hide.

Three example reels are seeded now with free stock video (Ramadan-2025,
Eid-2026, National Day-2025) — not real work, replace when you have actual
vertical cuts.
