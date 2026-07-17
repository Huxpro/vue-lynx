# AI chat technique media design

## Goal

Turn the AI Chat guide into a visual technical narrative. Each video must prove one interaction claim, and every source asset must remain in the repository for future presentations.

## Chosen approach

Use three short, silent, looping videos inside the existing “Native chat techniques” section:

1. **First send** establishes the relationship between the composer, the new bubble, and the empty response area.
2. **Second send** highlights the measured bubble launch from the bottom composer to the top anchor without showing the previous turn for a frame.
3. **Keyboard follow** shows the bottom composer tracking the iOS keyboard while the active conversation remains visible.

A single long video would make the reader hunt for each behavior. An interactive scrubber would add controls without improving the explanation. Short inline clips match the problem, technique, and result structure used by the Vercel v0 iOS article.

The drawer interaction is not part of the initial set. It can be added only if the recording demonstrates a distinct Main Thread Script result that the press-feedback clip does not already communicate.

## Asset layout

Keep the full-resolution presentation source under `examples/ai-chat/media/`:

- `native-chat-ios26-master.mov`: the complete source recording for presentations and future edits
- `README.md`: device, operating system, bundle commit, capture date, clip timings, and reproducible export commands

Store the web-specific derivatives under `website/docs/public/media/ai-chat/`:

- `native-first-send.mp4`: web-optimized first-send clip
- `native-second-send.mp4`: web-optimized repeat-send clip
- `native-keyboard-follow.mp4`: web-optimized keyboard clip
- matching `.webp` poster frames

The website preparation script deliberately excludes video binaries from example source listings. This two-tier layout keeps the presentation master out of the deployed website while committing both source and delivery assets to the repository. The web clips are derivatives, not duplicate copies of the master.

## Capture and export

Record on the existing iPhone 17 simulator running iOS 26. Use a clean Lynx Explorer launch and the current AI Chat native bundle. Capture one deterministic session with the keyboard visible for the send flows.

Use Lynx DevTool to verify the correct business LynxView and collect a stable screenshot. Use device automation for taps, text input, and submission. Record the complete simulator screen at its native resolution. Export clips with H.264 video, no audio, web fast-start metadata, and a 720 px display width while retaining the source frame rate. Keep the master unchanged and below GitHub’s file-size limit.

## Website presentation

Add one reusable `TechniqueVideo` documentation component. It renders a constrained phone-width figure with rounded corners, a subtle border, a poster, and a concise caption. Videos use `muted`, `loop`, `playsInline`, and `preload="metadata"`. The component plays only while visible and pauses when the reader requests reduced motion. Native browser controls remain available.

Place each figure directly after the paragraph it supports. Desktop layout keeps the phone recording narrow enough to preserve its native scale. Mobile layout uses the available width without horizontal scrolling.

English and Chinese pages use the same media files with localized captions and accessible labels.

## Validation

- Verify the full master and every clip with `ffprobe`
- Confirm every committed file is below GitHub’s 100 MB limit
- Build the AI Chat example and the Rspress site
- Inspect the English and Chinese rendered pages at desktop and mobile widths
- Confirm posters appear before playback, videos loop, controls work, and reduced-motion mode does not autoplay
- Confirm the second-send clip contains no previous-turn flash and ends with the bubble stable at its target
- Re-run lint, link checks for touched URLs, and PR checks
