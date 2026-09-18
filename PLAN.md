# HaithamMotion — Build and Reliability Plan

**Target:** a cinematic motion-graphic-designer portfolio that feels deliberate on desktop, tablet, and iPhone/iPad Safari.

**Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, `motion`, Lenis, filesystem content under `site/public/content/`, deployed through Vercel.

**Primary goal of this revision:** document the real responsive, media, and mobile-browser risks discovered during review, especially the Hero, Selected Work/mobile frame, Campaigns, and iOS Safari paths. This document is an implementation plan and QA contract; it is not a substitute for testing the deployed page on physical devices.

---

## 0. Current findings and decisions

### 0.1 Confirmed problem areas

1. **Hero alignment on tablet and laptop**
   - The Hero is visually left-heavy at intermediate widths.
   - This is not necessarily a media problem. It is a composition problem caused by the hero copy, overlay layers, and portrait card being positioned independently rather than inside a responsive composition grid.
   - Desktop must retain the editorial left anchor, but tablet must not look like a desktop layout compressed into a narrow viewport.

2. **Hero autoplay is unreliable on first load**
   - Hero uses `LazyVideo`.
   - The wrapper is observed before the conditional `<video>` exists. The first IntersectionObserver callback sets `nearView`, then the video mounts on the following React render. The callback cannot operate on the node that did not exist yet.
   - Native `autoPlay` may start, but relying on that alone makes the first visible video less reliable than videos mounted after later observer callbacks.
   - `LazyVideo` now has a post-mount playback effect that retries `play()` after `nearView` has mounted the element. This must remain covered by tests and device QA.

3. **Selected Work autoplay is especially sensitive**
   - Selected Work renders only the active slide's video; inactive slides render a poster.
   - `activeIndex` is derived from scroll progress. On initial load, the first slide is active, but the video is still mounted conditionally inside `LazyVideo`, creating the same mount/observer timing race as Hero.
   - The selected-work frame is vertical and must remain a centered device-like composition, not become a stretched full-bleed desktop video.
   - Every active slide needs a poster fallback while the video is loading and a predictable pause when it becomes inactive or leaves the viewport.

4. **Campaign previews autoplay more consistently, but their first visual frame is too square**
   - Campaign cards currently use `aspect-[4/5]`, which is close to square and determines the first rendered frame before the media has fully painted.
   - Campaign media needs a deliberate “full frame, not full screen” ratio. Use the source/media ratio where known; otherwise use a configurable campaign card ratio, preferably `9/16` for vertical campaign footage or `4/5` only for explicitly portrait editorial cards.
   - The modal may remain constrained by `max-h` and `max-w`, but its media viewport must preserve the media ratio instead of inheriting the preview card's shape accidentally.

5. **iOS/mobile browser behavior needs its own plan**
   - Safari has viewport-unit, safe-area, autoplay, visibility, and memory behavior that differs from desktop Chromium.
   - `100vh` can include browser UI and cause sticky sections to jump or crop. Prefer dynamic viewport units with a fallback: `min-height: 100vh; min-height: 100dvh` where appropriate.
   - `playsInline`, muted startup, poster fallback, and a user-visible play affordance for reduced-motion or failed autoplay are mandatory.
   - Do not assume a scroll event is a valid gesture for sound unlock. A tap, click, pointerdown, touchstart, or keypress is the reliable path.

### 0.2 Decisions locked

| Decision | Value | Reason |
|---|---|---|
| Runtime | Next.js 15 + TypeScript | Real component-level control over media and motion |
| Content | Filesystem CMS | Numbered folders are simpler than an admin dashboard |
| Database | None for portfolio content | No database is required for static media and copy |
| Media default | Muted, inline, looped, lazy/visibility-gated | Browser autoplay policy and performance |
| Sound | Start muted; unlock only after a trusted user gesture | Required by Chrome, Safari, and Firefox policy |
| Hero | Pinned, responsive composition | Keeps the signature visual while avoiding tablet compression |
| Selected Work | Pinned stack; one foreground video at a time | Limits decoders and preserves focus |
| Campaigns | Horizontal card rows with intentional media ratio | Prevents accidental square first paint |
| Mobile | Treat iOS Safari as a first-class target | It is not a smaller desktop browser |
| Reduced motion | Poster and explicit play controls | Accessibility and OS preference must win over autoplay |

---

## 1. Architecture

```text
site/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  └─ work/[slug]/page.tsx
├─ components/
│  ├─ chrome/
│  │  ├─ LenisProvider.tsx
│  │  ├─ SoundProvider.tsx
│  │  ├─ LoadSequenceProvider.tsx
│  │  └─ FrameHUD.tsx
│  ├─ media/
│  │  ├─ LazyVideo.tsx
│  │  ├─ PhoneFrame.tsx
│  │  ├─ PosterImage.tsx
│  │  └─ Lightbox.tsx
│  ├─ motion/
│  └─ sections/
│     ├─ 01Hero.tsx
│     ├─ 03SelectedWork.tsx
│     ├─ 04Reels.tsx
│     └─ Campaigns.tsx
├─ lib/
│  ├─ content.ts
│  └─ motion.ts
└─ public/content/
```

### Media ownership rules

- `LazyVideo` owns lazy mounting, autoplay attempt, pause-on-leave, reduced-motion behavior, and sound-manager registration.
- The parent section owns layout, active/inactive state, and which media should exist.
- A parent must never depend on a video being mounted synchronously after setting state.
- Every video must have a poster where possible. A `#t=0.1` URL fallback is useful but is not a replacement for a real poster on Safari.
- A rejected `play()` promise is expected browser behavior, not an exception to display to users. It must be observable in development and degrade to a poster/play control in production.

---

## 2. Responsive composition plan

### 2.1 Breakpoints and testing widths

Test at all of these widths, not only “mobile” and “desktop”:

- 360 × 800: small iPhone portrait
- 390 × 844: current iPhone portrait baseline
- 430 × 932: large iPhone portrait
- 768 × 1024: iPad portrait / tablet boundary
- 834 × 1194: iPad Air/Pro portrait
- 1024 × 768: tablet landscape / small laptop
- 1280 × 800: laptop
- 1440 × 900: desktop
- 1920 × 1080: large desktop

Also test zoom at 100%, 125%, and 200%. The layout must remain usable and must not depend on hover.

### 2.2 Hero alignment correction

The Hero should use a responsive inner composition rather than unrelated absolute offsets:

- Keep the media layer full bleed.
- Put all readable content inside a constrained container: `width: min(100% - 2*padding, max-width)`.
- Use a two-column grid only at a genuine desktop breakpoint, approximately `min-width: 1024px`.
- At tablet widths, use one column with a controlled max width and center the composition visually while retaining a modest left text anchor.
- Position the portrait card relative to the composition container, not relative to the viewport edge.
- Use CSS `clamp()` for horizontal padding and headline size.
- Avoid `right: 2.5rem`-style offsets that look correct at one width and drift at another.
- Check the interaction between the hero's large wordmark, the portrait, and the browser's safe-area inset.

Acceptance criteria:

- At 768px and 1024px widths, the headline and background subject read as intentionally composed, not clipped or stranded on the left.
- At 1440px and above, the existing editorial left alignment remains intentional.
- No horizontal scrollbar is introduced by the wordmark, motion transforms, or portrait card.
- The hero remains readable with portrait hidden if the available width is too small.

### 2.3 Phone frame and Selected Work composition

- Keep the phone frame centered in the pinned viewport.
- The phone must have a maximum width and a maximum height based on dynamic viewport height, not only a fixed pixel width.
- Use `max-height: calc(100dvh - safe-area allowance - section chrome)` and derive width from the phone aspect ratio.
- Do not let the surrounding slide's `h-full w-full` cause the vertical media to stretch.
- Keep the video inside the frame with `object-fit: cover` only when cropping is explicitly intended; otherwise use `object-fit: contain` against the designed background.
- Preserve the notch and rounded clipping on iOS.
- On short landscape tablets, shrink the phone before reducing the content's usable height.

Acceptance criteria:

- The entire phone remains visible on 768×1024, 1024×768, and 390×844.
- The phone does not jump when Safari's address bar expands or collapses.
- Only the active Selected Work video is decoded and playing.
- When changing slides, the outgoing video pauses and the incoming video gets a poster immediately.

---

## 3. Autoplay and visibility design

### 3.1 Required `<video>` attributes

For muted ambient videos:

```tsx
<video
  muted
  playsInline
  autoPlay
  loop
  preload="metadata"
  poster={poster ?? undefined}
/>
```

Notes:

- `muted` must be true before the first `play()` attempt. Use the DOM property as well as the React prop when sound state changes.
- `playsInline` is mandatory on iOS; without it Safari may use a native fullscreen player.
- `preload="metadata"` is a reasonable default for active/near-visible media. Use `none` only when the mount/play sequence has been proven reliable on target devices.
- Do not attach a video source to every inactive pinned slide.

### 3.2 `LazyVideo` lifecycle

The correct lifecycle is:

1. Observe the wrapper.
2. When near the viewport, set `nearView`.
3. React mounts the video.
4. A post-mount effect obtains the real video element.
5. Set `muted`, claim sound ownership if applicable, and call `play()`.
6. If `play()` rejects, keep the poster visible and expose a play affordance where the context requires user interaction.
7. On leaving the visibility threshold, pause the element.
8. On returning, call `play()` again.
9. On unmount or source change, pause and reset any section-specific state.

The post-mount retry added to `LazyVideo` is specifically required for the Hero and first Selected Work slide. Do not remove it in favor of only the observer callback.

### 3.3 Make autoplay failures diagnosable

During development, record:

- source URL
- `readyState`
- `paused`
- `muted`
- `document.visibilityState`
- intersection state
- whether `play()` rejected and its error name

Do not silently swallow every failure while debugging. In production, avoid noisy user-facing errors, but retain a poster and play button fallback.

### 3.4 Avoid competing observers

- A section's active state and `LazyVideo`'s visibility state are separate concerns.
- A video may be mounted because it is the active slide but still be outside the viewport; it must remain paused.
- A video may be near the viewport but not the active slide; the parent should not mount it merely because it is near.
- Sound exclusivity should mute other sound-managed videos, but it must not be used as a replacement for pausing inactive media.

### 3.5 Sound behavior

- Start every autoplaying video muted.
- Unlock sound only in a trusted event handler.
- Use synchronous DOM mutation inside that handler before updating React state.
- Do not treat wheel/scroll as a guaranteed sound gesture.
- Do not allow several ambient campaign previews to compete for audio; campaign grid previews should remain force-muted.
- A focused, explicitly opened Lightbox video may use the opening click as its user gesture, but it must still handle browsers that refuse unmuted autoplay.

---

## 4. Campaign media framing

### Current issue

`Campaigns.tsx` currently defines the preview button as `aspect-[4/5]`. This makes a 9:16 video appear inside a nearly square editorial card during first paint and can make the later video look like it suddenly changes shape.

### Planned correction

Introduce an explicit media-ratio decision:

```ts
type MediaRatio = "16:9" | "9:16" | "4:5" | "1:1";
```

Preferred order:

1. A ratio declared in campaign metadata.
2. A ratio inferred from the media asset or campaign type.
3. A section default chosen intentionally, not accidentally.

For the current campaign material, default vertical footage to `9:16`. Render the card using a ratio class selected from data, for example:

```tsx
const ratioClass = ratio === "9:16" ? "aspect-[9/16]" : ratio === "16:9" ? "aspect-video" : "aspect-[4/5]";
```

The card should be “full frame” in the sense of showing the whole designed media frame inside a bounded card, not full viewport. Avoid `h-screen`, `fixed`, or a viewport-sized modal for the preview.

For the Lightbox:

- Use `max-h-[calc(100dvh-2rem)]` with safe-area padding.
- Let the media wrapper use the selected ratio.
- Constrain width with `min(92vw, 32rem)` or an equivalent responsive rule.
- Use `object-contain` if preserving the entire frame is more important than filling every pixel.
- Keep controls accessible and visible on iOS.

Acceptance criteria:

- A vertical campaign opens in a vertical frame on first paint; no square flash.
- A landscape campaign remains landscape.
- No campaign card or Lightbox exceeds the usable dynamic viewport.
- The card remains tappable with a visible focus/pressed state and no hover-only behavior.

---

## 5. iOS Safari and mobile browser plan

### 5.1 Viewport and safe areas

- Add the correct viewport configuration through Next metadata: `width=device-width, initial-scale=1, viewport-fit=cover`.
- Use `100dvh` for current visible viewport height, with `100vh` fallback.
- Use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, and horizontal safe-area values for fixed HUD, header, sticky content, and Lightbox controls.
- Never assume `100vh` is stable while Safari chrome is moving.
- Test both toolbar-expanded and toolbar-collapsed states.

### 5.2 Touch and scrolling

- Keep Lenis disabled or carefully configured on touch devices if it interferes with native momentum scrolling.
- Never prevent the page's touchmove globally.
- Do not hijack wheel, touch, or pointer events to fake scroll progress.
- Horizontal campaign rows must support native touch scrolling and must not trap vertical swipes.
- The Lightbox must lock background scrolling without breaking safe-area positioning or back navigation.

### 5.3 Video and memory

- Keep only the active pinned video and genuinely visible ambient previews playing.
- Pause videos on `visibilitychange` when the page is backgrounded.
- Pause or release media when a Lightbox closes.
- Avoid decoding multiple high-bitrate videos in the first viewport.
- Encode mobile-friendly H.264 variants; do not use oversized desktop masters for every phone viewport.
- Posters must be optimized WebP/AVIF where supported, with a reliable JPEG fallback when necessary.
- Consider `content-visibility` only after verifying that it does not interfere with IntersectionObserver and pinned sections.

### 5.4 Interaction fallback

Every autoplay-dependent visual must still communicate its content if autoplay fails:

- poster or first-frame image
- accessible label
- visible play control when the video is a focal interaction
- no blank black rectangle
- no layout shift while the media loads

Reduced-motion users should receive a poster and native controls rather than an auto-looping background.

### 5.5 iOS test matrix

Test on physical Safari where possible:

- iPhone on Wi-Fi, Low Power Mode off/on
- iPhone with Safari toolbar expanded/collapsed
- iPad portrait and landscape
- first visit, reload, back navigation, and deep link with a hash
- page opened from an external app
- private browsing
- muted autoplay before and after a tap
- sound toggle after a video is already playing
- orientation change while a pinned section is active
- reduced-motion enabled in Accessibility

Also test Chrome on iOS because it uses WebKit but can differ in lifecycle and UI integration.

---

## 6. Section-specific implementation checklist

### Hero

- [ ] Replace viewport-edge absolute composition with responsive inner container/grid.
- [ ] Verify tablet/laptop alignment at 768, 834, 1024, and 1280 widths.
- [ ] Keep a real poster for the background video.
- [ ] Confirm `LazyVideo` post-mount playback runs on initial load.
- [ ] Confirm Hero pauses when the section is fully off-screen.
- [ ] Confirm the portrait does not overlap the headline at 200% zoom.
- [ ] Confirm safe-area padding on iPhone.

### Selected Work

- [ ] Keep only the active slide's video mounted.
- [ ] Ensure active-index calculation is correct at progress 0 and after hydration.
- [ ] Ensure the first active video receives a post-mount playback attempt.
- [ ] Pause the outgoing video before or during slide replacement.
- [ ] Preserve a vertical frame without stretching.
- [ ] Keep the pinned section usable with reduced motion and touch scrolling.
- [ ] Verify no covered slide continues decoding.

### Campaigns

- [ ] Replace hard-coded `aspect-[4/5]` with metadata-driven ratio.
- [ ] Default current vertical footage to `9:16`.
- [ ] Keep previews force-muted.
- [ ] Add poster-first loading state.
- [ ] Make Lightbox media ratio-aware and safe-area aware.
- [ ] Test horizontal swipe without accidental vertical scroll lock.

### Reels

- [ ] Keep `playsInline`, poster, and visibility pause behavior.
- [ ] Test AnimatePresence source replacement on Safari.
- [ ] Pause the old element before the new source becomes active.
- [ ] Confirm the phone frame uses dynamic viewport height on short landscape screens.

---

## 7. Performance and accessibility budgets

- Sustained 60fps scrolling on a mid-range laptop and acceptable touch scrolling on a recent iPhone.
- LCP target under 2.5 seconds on a good mobile connection.
- Do not load every homepage video during first paint.
- Keep the initial video bytes bounded; prefer posters and metadata before full decode.
- Animate transforms and opacity wherever possible.
- Use no more than one actively blurred layer at a time.
- All controls have keyboard focus styles and accessible names.
- Touch targets should be at least approximately 44×44 CSS pixels.
- Do not rely on color alone for active carousel state.
- `prefers-reduced-motion` disables Lenis, autoplay loops, and decorative transitions while retaining usable media controls.

---

## 8. QA procedure before deployment

1. Run typecheck, lint, and production build.
2. Test a cold load with cache disabled.
3. Test a warm reload and back navigation.
4. Test a deep link containing a hash; the page must still establish the intended top-of-page state before smooth scrolling.
5. Record whether Hero starts, whether the first Selected Work video starts, and whether later videos pause correctly.
6. Inspect the Network panel to ensure inactive videos are not fetched unnecessarily.
7. Inspect the Media panel for more than one unexpected playing video.
8. Test autoplay after a user tap and before a user tap; both states must be understandable.
9. Test campaign card first paint and Lightbox ratio.
10. Repeat at every width in §2.1.
11. Repeat in Safari iOS/iPadOS, desktop Safari, Chrome, and Firefox.
12. Enable reduced motion and verify no auto-motion is required to understand the site.
13. Verify no horizontal overflow and no clipped fixed controls.
14. Deploy the standalone `haitham72/Portfolio` repository that Vercel actually reads; updating only a different monorepo copy does not update production.

---

## 9. Definition of done

- [ ] Hero is intentionally aligned at desktop, tablet, and laptop widths.
- [ ] Hero autoplay starts reliably when muted, with poster fallback if the browser rejects playback.
- [ ] First Selected Work video starts reliably and inactive slides do not decode/play.
- [ ] Selected Work phone/mobile frame is centered and fully visible on short screens.
- [ ] Campaign previews show their intended full media frame rather than an accidental square first frame.
- [ ] Campaign Lightbox respects media ratio, dynamic viewport height, and safe areas.
- [ ] Reels and all other videos pause when genuinely off-screen or the document is hidden.
- [ ] iOS Safari has been tested in portrait, landscape, toolbar-expanded, and toolbar-collapsed states.
- [ ] Reduced motion produces a complete, usable poster/control experience.
- [ ] No layout shift, horizontal overflow, or inaccessible keyboard/touch control remains.
- [ ] Production build passes and the deployed repository is the one connected to Vercel.

---

## 10. Next implementation order

1. Verify the already-added `LazyVideo` post-mount autoplay fix on a cold desktop and iOS load.
2. Correct Hero responsive composition and test the tablet/laptop alignment.
3. Harden Selected Work active-video lifecycle and dynamic phone sizing.
4. Add campaign ratio metadata/defaults and replace the hard-coded 4:5 preview shape.
5. Add dynamic viewport and safe-area handling to layout, pinned sections, HUD, and Lightbox.
6. Add development diagnostics for rejected `play()` promises and unexpected playing videos.
7. Run the full QA matrix, then deploy the standalone Portfolio repository.
