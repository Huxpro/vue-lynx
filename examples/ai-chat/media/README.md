# Native chat recordings

These clips document the native chat interactions used in the Vue Lynx website article. They are kept in the repository so the original-resolution material remains available for talks and future edits.

## Capture provenance

- Device: iPhone 17 Pro simulator (`FC34573A-14E6-47BF-9D02-E8E7DFAF329D`)
- Runtime: iOS 26.2 (`23C54`)
- Host: LynxExplorer, Lynx SDK 1.4
- Source bundle: `examples/ai-chat` from the `agent/ai-chat-native-learnings` branch for PR #217
- Captured: 2026-07-16
- Prompts: `Explain Vue Lynx in one sentence` and `How does its main thread work?`

`native-first-send.mp4`, `native-second-send.mp4`, and `native-keyboard-follow.mp4` are the presentation-quality, full-resolution edits. `native-chat-ios26-master.mov` concatenates the three moments in that order. The website uses smaller derivatives from `website/docs/public/media/ai-chat/`.

## Capture and export

The simulator sources were recorded with `simctl`, then trimmed to the interaction instead of retaining the long static lead-in that CoreSimulator sometimes writes into the timeline:

```sh
xcrun simctl io FC34573A-14E6-47BF-9D02-E8E7DFAF329D recordVideo --codec=h264 capture.mov

ffmpeg -ss START -t DURATION -i capture.mov \
  -vf 'fps=30,format=yuv420p' -an \
  -c:v libx264 -preset slow -crf 18 -movflags +faststart clip.mp4
```

The web exports use a 720 px width, H.264, CRF 25, and WebP poster frames. Run `pnpm --dir website validate:ai-chat-media` after replacing any recording.
