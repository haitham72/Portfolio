# prompt 01

# Product Requirements Document: HaithamMotionPortfolio

## Intent & Goal
A production-ready, cinematic personal motion design portfolio for Haitham Mohamed. It prioritizes a premium viewing experience backed by a robust, dynamic database architecture that allows the owner to update all content (videos, text, layout order) via a custom admin dashboard without writing code.

## Audience & Roles
Public Viewers: Anyone visiting the site to view the portfolio. Admin: Haitham Mohamed, who has exclusive access to the dashboard to manage content, upload media, and adjust site settings.

## Core Flows
*These flows must work end-to-end:*

1. Admin logs into the custom dashboard, creates a new project collection, uploads media (9:16 or 16:9), adds metadata, and publishes the changes.
2. Visitor lands on the public site and scrolls through a cinematic, dynamic presentation of horizontal works and mobile-first vertical reels.
3. Admin updates global site settings from the dashboard, such as selecting between Google Fonts and SF Pro, which immediately reflects on the public frontend.
4. If the database has no content yet, the site automatically renders high-quality open-source placeholder media to demonstrate the layout.

## Technical Requirements
Fully database-driven architecture (using platform's native DB in place of external Supabase). Optimized video performance (lazy loading, poster frames). Dashboard toggles for fonts. Mockup fallback data for empty states. Auth-gated dashboard access.

## Design Preferences
Dark, cinematic, premium, minimal, and editorial. Strong emphasis on large typography, subtle motion (Framer Motion), and prominent media display without generic UI templates. Mobile-view section focuses purely on vertical 9:16 format.

# prompt 2 'my review on the build'

- the tool stack should be animated carousel automatically with icons, add Ai creative tools
- i cant see any dynamic animation images/videos scrolls, add imges from public for testing
- give me the folder map with names or you actually create empty folders in supabase 'storage ' so i can fill it
- i still dont see the iphone part where it captures the focus for couple of videos that play automatically like the image i shared
- i still dont see selected work capture view vertical carousel
---
you do know this is anamorphic:
https://anamorph.framer.website/
right?
- your new section of tool kits is amazing, it should be after the work tho, and button flat not raised

# prompt 3 - builder prompt

Here's the full enhanced 3rd prompt, ready to paste:

---

# PROMPT 3 — DESIGN DNA, INTERACTION SPEC & CMS CONTRACT

You are continuing a from-scratch cinematic motion-design portfolio build. Prompts 1 (foundation + hero) and 2 (work sections) established the shell and the core reels. This prompt locks the **visual language, section architecture, interaction rules, and data model** so the whole site reads as one cohesive cinematic reel — matching the reference at `anamorph.framer.website`.

## Reference images (attached)
- **Image 1** = the hero layout. Note specifically: the faint vertical timeline grid with `00:00 / 00:30 / 01:00 / 01:30 / 02:00` stamps across the top, the red `REC` dot + live timecode `00:14:09:15` top-left, the `(01) — SERVICES` numbered section label, the large semi-transparent serif wordmark behind everything, and the floating intro card bottom-right.
- **Image 2** = the phone reels mockup. Note: iPhone frame with notch + status bar, Instagram-reels social UI (heart / comment / share counts, @handle caption, progress bars), vertical 9:16 video auto-playing inside the device.

Match these precisely. The single biggest reason a rebuild "doesn't feel like the reference" is missing the **REC/timecode + numbered-section + timeline-grid** motif — implement it everywhere, not just the hero.

## Section order + numbering
Every section header uses the anamorphic pattern: `(0X) — TITLE`, a small `+` marker, and a running timecode like `00:03:00:00` that increments per section as if the whole page is one film reel. Sections, in order:

1. **(01) — SERVICES** — the toolkit. Auto-scrolling icon marquee, one row per category, alternating scroll directions, pauses on hover. Real brand icons via `https://cdn.simpleicons.org/<slug>` with an initials-badge fallback if an icon 404s. Categories: 3D (Cinema 4D, Blender, Houdini, 3ds Max), Compositing (After Effects, Nuke), Editing (Premiere Pro, DaVinci Resolve), Design (Photoshop, Illustrator, Figma), **AI Creative** (Midjourney, Runway, Sora, Kling AI, Pika, ComfyUI, ElevenLabs, Suno). **This section sits AFTER Selected Work, not before it.**
2. **(02) — EDITED FOR** — client logo wall. Grayscale logos, colorize on hover. If no clients yet, hide the section entirely.
3. **(03) — SELECTED WORK** — capture view + vertical carousel. A large viewfinder frame (red REC dot, live timecode, corner brackets, aspect-ratio label) auto-plays the featured reel; a vertical thumbnail strip beside it swaps the featured reel. Click the frame → fullscreen viewer.
4. **(04) — SHORT-FORM REELS** — the iPhone mockup. Notch, status bar, Instagram-reels social UI, auto-play + auto-advance every ~6s, scroll-snap between reels inside the device.
5. **(05) — ABOUT** — "Every frame handled by the same person" editorial layout. Portrait + bio + the credit-list motif (EDIT / GRADE / SOUND / TITLES / MOTION all = same name).
6. **(06) — RATES** — three flat rate cards (One Cut / Retainer / Day Rate) with clear pricing. Hide if no rates set.
7. **(07) — CLIENT REVIEWS** — testimonials carousel. Hide if empty.
8. **(08) — BOOKING / CONTACT** — the closing statement + contact links + footer.

## Color + type system
- Base background `#0a0a0a` (near-black), text `#ffffff`, meta/subtitle `#a0a0a0` muted gray. No other accent colors except the red REC dot (`#ff4500`-ish) and a single optional warm accent on CTAs.
- Geometric sans-serif for headings/body. Oversized translucent serif wordmark used as a background motif (low opacity, behind sections) — this is signature anamorph.
- **All buttons are FLAT.** No raised, elevated, shadowed, or 3D buttons anywhere. CTAs are flat pills (solid fill or outline), full-radius, zero box-shadow. This is a hard rule.

## The REC / timecode motif (apply everywhere)
- Every section header carries: the `(0X) — TITLE` label, a `+` marker, and a running timecode that reads like a film frame counter (`00:0X:00:00`).
- Faint vertical timeline grid lines can appear behind section transitions.
- The hero's live timecode ticks in real time.
- This motif is non-negotiable for matching the reference — it's what makes the page read as "a reel" rather than "a portfolio."

## Interaction rules
- All videos auto-play in-view, muted, looped, `playsInline`, `preload="none"` until visible (IntersectionObserver).
- Reels auto-advance every ~6s; user scroll-snap overrides the timer until idle.
- Work cards: poster-first, hover-to-preview the muted video, click opens fullscreen viewer.
- Fullscreen viewer: keyboard ESC to close, arrow keys to navigate between reels in the collection.
- Respect `prefers-reduced-motion`: disable auto-advance and marquee animation, keep static posters.

## CMS contract (what's dynamic vs static)
Dynamic, stored in entities and editable from the admin dashboard:
- **Collection** (section: selected_work | mobile_view, title, year, category, annotation, cover_media, display_order, is_active)
- **Project** (collection_id, title, description, annotation, video_url, poster_url, aspect_ratio: 9:16 | 16:9 | 1:1, duration, display_order, is_active)
- **ToolkitItem** (name, logo, category, display_order, is_active)
- **Testimonial** (client_name, role_company, testimonial, avatar_url, year, project, display_order, is_active)
- **SuccessStory** (client_project, challenge, solution, result, metric, year, media_url, display_order, is_active)
- **ValueItem** (title, description, display_order, is_active)
- **SiteSetting** (key/value pairs: hero_*, about_*, contact_*, mobile_*, font_family, closing_statement)

Static (hardcoded layout, not entity-driven): the section numbering, the REC/timecode motif, the iPhone frame, the viewfinder frame, the credit-list motif in About.

**Mockup fallback**: when the database is empty, render high-quality placeholder content (Picsum posters at 720×1280, sample MP4s from `commondatastorage.googleapis.com/gtv-videos-bucket/sample/`) so the site looks complete before any content is added. The fallback must be visually indistinguishable from real content — same layouts, same interactions.

**Never hardcode portfolio items.** Content and presentation stay fully decoupled: the public site reads only from entities + settings; the admin dashboard writes to them.

## Storage
Use the platform's native file upload (UploadPublicFile) — NOT Supabase. Storage is flat (no real folders); use a naming convention: `hero/`, `collections/<id>/cover`, `projects/<id>/video`, `projects/<id>/poster`, `toolkit/<slug>`, `testimonials/<id>/avatar`, `success/<id>/media`. Upload through the admin dashboard; it saves the returned URL into the matching entity field automatically.

## Deliverables for this prompt
1. Sections 01 (toolkit, after work), 02 (clients), 05 (about), 06 (rates), 07 (reviews), 08 (booking) — fully built and wired to entities.
2. The REC/timecode + numbered-section + timeline-grid motif applied to every section header.
3. Flat buttons everywhere — audit and fix any raised/shadowed CTAs.
4. Mockup fallbacks populated for every new section so the site looks complete empty.
5. `prefers-reduced-motion` handling on all auto-animation.
6. Mobile + desktop responsive throughout; 9:16-first for reels, 16:9 for capture-view work.

---

That's the full prompt. Two things to flag before you send it: (1) this assumes Prompts 1 and 2 already built the hero and the work sections — if they didn't land cleanly, Claude will struggle, so make sure those are solid first; and (2) the "rates" section is new — anamorph has it but your original spec didn't, so I included it to match the reference. Drop it if you don't want pricing public.