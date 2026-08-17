# Native Chat Interaction Fixes

## Goal

Make the AI chat composer, mobile drawer, and message editor behave like native mobile controls in LynxExplorer without changing the established Nuxt visual design.

## Design

### Keyboard avoidance

The main chat composer is a full-width absolute dock anchored to `bottom: 0` inside the relatively positioned chat page, matching Lynx's official keyboard-avoidance structure. A focused native input causes Lynx to emit `keyboardstatuschanged`; a small composable subscribes through `GlobalEventEmitter` and applies the official pattern directly to the dock with `setNativeProps`. When the keyboard opens, the dock translates upward by the reported keyboard height over 300 ms. When it closes, the transform resets over 100 ms. The scroll content reserves 128 px below its messages so the dock does not cover the final message and actions.

The listener is registered only while `ChatPage` is mounted and removed during teardown. Invalid or missing keyboard heights resolve to zero. Web continues to use its browser-provided viewport behavior because the composable becomes a no-op when the Lynx global event module is unavailable.

### Drawer motion

The mobile sidebar panel and its dismissal backdrop use separate Vue Lynx `<Transition>` instances. The panel enters from `translateX(-100%)` over 240 ms with a decelerating curve and exits over 180 ms. The backdrop fades on the same schedule. Only transform and opacity are animated, keeping the native renderer on inexpensive properties and preserving interaction and layout.

### Native edit value

The raw message edit `<input>` uses Vue Lynx `v-model` for subsequent updates, but native initialization does not rely on the ordinary `value` prop alone. After mount and `nextTick`, a small composable invokes the input's documented native `setValue` UI method with the original message. This guarantees that iOS creates the editor with visible text while `v-model` continues to own edits afterward.

## Verification

- Unit tests exercise keyboard event subscription, offset normalization, native props, and cleanup.
- Source-level regression tests lock the bottom-dock layout, drawer transitions, and native editor wiring.
- The full AI chat test suite, lint, Web build, and Lynx build must pass.
- The generated bundle must load in the official LynxExplorer on the iOS Simulator.
- Simulator checks cover keyboard-open composer position, drawer entrance/exit motion, and a pre-filled message editor.
