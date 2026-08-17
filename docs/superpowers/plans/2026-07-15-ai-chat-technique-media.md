# AI Chat Technique Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable iPhone 17 recordings to the bilingual AI Chat guide so each key native interaction has a focused visual explanation.

**Architecture:** Keep one presentation-quality master in the AI Chat example and publish three web derivatives from the website public directory. A global Rspress `TechniqueVideo` component owns playback, reduced-motion behavior, layout, and captions; the English and Chinese MDX pages only supply localized content and asset URLs.

**Tech Stack:** iOS Simulator, Lynx Explorer, Lynx DevTool, agent-device, FFmpeg/FFprobe, React, Sass modules, Rspress MDX, pnpm

---

### Task 1: Add a deterministic media validator

**Files:**
- Create: `website/scripts/validate-ai-chat-media.mjs`
- Modify: `website/package.json`

- [ ] **Step 1: Create the validator before the assets exist**

Implement a Node script that checks these exact files:

```js
const media = [
  ['examples/ai-chat/media/native-chat-ios26-master.mov', 'video'],
  ['website/docs/public/media/ai-chat/native-first-send.mp4', 'video'],
  ['website/docs/public/media/ai-chat/native-second-send.mp4', 'video'],
  ['website/docs/public/media/ai-chat/native-keyboard-follow.mp4', 'video'],
  ['website/docs/public/media/ai-chat/native-first-send.webp', 'poster'],
  ['website/docs/public/media/ai-chat/native-second-send.webp', 'poster'],
  ['website/docs/public/media/ai-chat/native-keyboard-follow.webp', 'poster'],
];
```

Resolve paths from the repository root. Fail if a file is missing, empty, or at least 100 MB. For videos, run `ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json` and require H.264, positive duration, and positive dimensions. Require web clips to be no wider than 720 px and between 2s and 12s. Print one summary line per valid file.

- [ ] **Step 2: Register the command**

Add this script to `website/package.json`:

```json
"validate:ai-chat-media": "node scripts/validate-ai-chat-media.mjs"
```

- [ ] **Step 3: Run the validator and confirm the expected red state**

Run: `pnpm --dir website validate:ai-chat-media`

Expected: non-zero exit with `Missing media file` for the master and derivatives.

- [ ] **Step 4: Commit the validator**

```bash
git add website/scripts/validate-ai-chat-media.mjs website/package.json
git commit -m "test: validate AI chat media assets"
```

### Task 2: Re-record and preserve the native interaction source

**Files:**
- Create: `examples/ai-chat/media/native-chat-ios26-master.mov`
- Create: `examples/ai-chat/media/README.md`
- Create: `website/docs/public/media/ai-chat/native-first-send.mp4`
- Create: `website/docs/public/media/ai-chat/native-second-send.mp4`
- Create: `website/docs/public/media/ai-chat/native-keyboard-follow.mp4`
- Create: `website/docs/public/media/ai-chat/native-first-send.webp`
- Create: `website/docs/public/media/ai-chat/native-second-send.webp`
- Create: `website/docs/public/media/ai-chat/native-keyboard-follow.webp`

- [ ] **Step 1: Prepare a clean native build**

Remove `examples/ai-chat/node_modules/.cache`, start `pnpm dev` in `examples/ai-chat`, restart Lynx Explorer, and open the local `main.lynx.bundle`. Use Lynx DevTool `list-clients`, `list-sessions`, and `take-screenshot` to verify the business LynxView before recording.

- [ ] **Step 2: Record three source segments**

Use `xcrun simctl io <iphone_17_udid> recordVideo --force` to record these temporary files while agent-device supplies taps and text input:

```text
/tmp/ai-chat-first-send.mov
/tmp/ai-chat-second-send.mov
/tmp/ai-chat-keyboard-follow.mov
```

For the first segment, open a new chat, focus the composer, type `Explain Vue Lynx in one sentence`, and submit. Stop after the bubble reaches its anchor.

For the second segment, keep the same conversation and keyboard state, type `How does its main thread work?`, and submit. Stop only after the second bubble is stable and the thinking indicator appears. Reject and repeat the take if the previous turn flashes during the handoff.

For the keyboard segment, focus and dismiss the composer once, then focus it again while the last turn remains visible. Stop after the composer settles above the keyboard.

- [ ] **Step 3: Create the presentation master**

Concatenate and encode the three source segments at presentation quality:

```bash
ffmpeg -i /tmp/ai-chat-first-send.mov -i /tmp/ai-chat-second-send.mov -i /tmp/ai-chat-keyboard-follow.mov -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart examples/ai-chat/media/native-chat-ios26-master.mov
```

- [ ] **Step 4: Export the web clips and posters**

For each temporary segment, create an H.264 derivative with `-vf scale=720:-2 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -an`. Extract a representative poster after the bubble starts moving with `-ss 0.5 -frames:v 1 -vf scale=720:-2 -c:v libwebp -quality 82`.

- [ ] **Step 5: Document provenance and reproducibility**

Write `examples/ai-chat/media/README.md` with the simulator name and UDID, iOS version, source commit, capture date, exact prompts, raw segment names, export commands, clip durations, and the statement that the master is the presentation source.

- [ ] **Step 6: Verify the assets**

Run: `pnpm --dir website validate:ai-chat-media`

Expected: seven `PASS` lines and exit code 0. Also run `du -h` on every asset and confirm no file approaches 100 MB.

- [ ] **Step 7: Commit the durable media**

```bash
git add examples/ai-chat/media website/docs/public/media/ai-chat
git commit -m "docs: preserve native AI chat recordings"
```

### Task 3: Build the reusable documentation video figure

**Files:**
- Create: `website/src/components/technique-video/TechniqueVideo.tsx`
- Create: `website/src/components/technique-video/index.module.scss`
- Modify: `website/rspress.config.ts`

- [ ] **Step 1: Implement visibility-aware playback**

Create a global MDX component with this public interface:

```ts
export interface TechniqueVideoProps {
  src: string;
  poster: string;
  label: string;
  caption: string;
}
```

Render a `figure`, `video`, and `figcaption`. The video must use `muted`, `loop`, `playsInline`, `controls`, and `preload="metadata"`. Use `matchMedia('(prefers-reduced-motion: reduce)')` and `IntersectionObserver`. Pause when reduced motion is enabled or the figure leaves the viewport; call `play()` only when visible and motion is allowed. Ignore the rejected play promise because browsers can still require interaction.

- [ ] **Step 2: Implement the article layout**

Style the figure with a maximum width of 390 px, centered margin, 18 px radius, subtle theme-aware border and shadow, overflow clipping, and a caption using Rspress secondary text colors. At widths below 480 px, use the full content width and a 14 px radius. Keep the video background black and `display: block` to remove inline gaps.

- [ ] **Step 3: Register the component globally**

Add `src/components/technique-video/TechniqueVideo.tsx` to `markdown.globalComponents` in `website/rspress.config.ts` beside `Go.tsx`.

- [ ] **Step 4: Verify TypeScript and Rspress compilation**

Run: `pnpm --dir website exec rspress build`

Expected: Rspress renders pages and exits 0.

- [ ] **Step 5: Commit the component**

```bash
git add website/src/components/technique-video website/rspress.config.ts
git commit -m "docs: add native technique video figure"
```

### Task 4: Turn the bilingual guide into a visual narrative

**Files:**
- Modify: `website/docs/guide/ai-chat.mdx`
- Modify: `website/docs/zh/guide/ai-chat.mdx`

- [ ] **Step 1: Add the first-send section and video**

Add `### First send establishes the stage` and its Chinese equivalent. Explain that the first send changes the composer-led empty state into an anchored conversation before the assistant appears. Add `TechniqueVideo` with the first-send clip, poster, localized accessible label, and caption.

- [ ] **Step 2: Combine repeat-send scrolling and bubble handoff**

Replace the separate renderer-scroll and layout-settling sections with `### Repeat sends anchor the next turn`. Preserve the `nextTick()` and `scrollIntoView` API links. Explain the staged spacer, instant anchor alignment, later-frame transition, delayed assistant reveal, and Web `scroll-top` fallback. Add the second-send video immediately afterward.

- [ ] **Step 3: Add the keyboard video**

Keep the `<input>` keyboard avoidance and `keyboardstatuschanged` references. Add the keyboard-follow video after the paragraph and state that it was captured on the iPhone 17 simulator running iOS 26.

- [ ] **Step 4: Keep the main-thread section concise**

Retain the Main Thread Script link and drawer/press explanation without adding a fourth video. This keeps the article focused on the chat-send path.

- [ ] **Step 5: Review against the current writing guidelines**

Fetch the latest Vercel writing guidelines. Check headings, paragraph length, active voice, direct claims, link labels, punctuation, and captions in both language versions. Keep each video adjacent to the claim it proves.

- [ ] **Step 6: Build and commit the article**

Run: `pnpm lint`, `git diff --check`, and `pnpm --dir website exec rspress build`.

Expected: all commands exit 0.

```bash
git add website/docs/guide/ai-chat.mdx website/docs/zh/guide/ai-chat.mdx
git commit -m "docs: illustrate native AI chat techniques"
```

### Task 5: Inspect the rendered result and update PR #217

**Files:**
- Modify only if inspection finds a concrete issue: `website/src/components/technique-video/index.module.scss`
- Modify only if inspection finds a concrete issue: `website/docs/guide/ai-chat.mdx`
- Modify only if inspection finds a concrete issue: `website/docs/zh/guide/ai-chat.mdx`

- [ ] **Step 1: Start the production preview**

Run `pnpm --dir website preview --host 127.0.0.1` after a successful Rspress build.

- [ ] **Step 2: Inspect desktop and mobile layouts**

Open `/guide/ai-chat` and `/zh/guide/ai-chat` at 1440 × 1000 and 390 × 844. Confirm the video width, spacing, captions, posters, controls, and relationship to each technical paragraph. Capture screenshots for evidence.

- [ ] **Step 3: Inspect motion behavior**

Confirm each video plays only while visible, loops without an obvious jump, pauses outside the viewport, and does not autoplay when reduced motion is enabled. Watch the second-send video at normal speed and frame-step around the landing to confirm there is no previous-turn flash or final-position jitter.

- [ ] **Step 4: Run final verification**

Run `pnpm --dir website validate:ai-chat-media`, `pnpm lint`, `git diff --check`, and `pnpm --dir website exec rspress build` from the final tree. Check `git status` contains no uncommitted source changes.

- [ ] **Step 5: Push and update the pull request**

Push `agent/ai-chat-native-learnings` with `--force-with-lease` because the already-pushed design commit was amended. Update PR #217 with the media summary, asset provenance, validation commands, and direct preview routes. Wait for GitHub and Vercel checks and inspect the deployed English and Chinese pages if the preview succeeds.
