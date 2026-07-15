# AI Chat Agent Spinner Integration

## Goal

Use the Vue Lynx work from `Huxpro/lynx-agent-spinners` for the AI Chat
thinking indicator while keeping the example dependency-light and making a
future migration to a published package mechanical.

## Current behavior

The AI Chat example ports the Nuxt template's 4×4 dot-matrix
`ChatIndicator`. It is shown by `ChatPage.vue` after submission and before the
assistant emits its first reasoning or text part. Streamed reasoning uses the
separate collapsible `ReasoningPart` and must retain its existing chevron and
label behavior.

## Chosen spinner

Use the `dots2` definition from `lynx-agent-spinners`:

```ts
{
  name: 'dots2',
  frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  interval: 80,
  category: 'braille',
}
```

It is a single-cell Braille animation, so it has stable width, low layout
cost, and a terminal/agent visual language. Wider spinners such as `pulse`
would require a larger fixed container, while `breathe` intentionally contains
blank frames that can look like a rendering failure.

## Architecture

Vendor the smallest useful Vue slice inside the AI Chat example:

- `src/lib/agent-spinner.ts`: `SpinnerDefinition`, the `dots2` definition, and
  source/license provenance.
- `src/composables/useSpinnerFrame.ts`: Vue timer lifecycle and reduced-motion
  fallback.
- `src/components/chat/AgentSpinner.vue`: native `<view>/<text>` renderer with
  a fixed 16×16 container and monospace text.
- `Indicator.vue`: remain as the chat-facing compatibility component and
  delegate to `AgentSpinner`. `ChatPage.vue` therefore needs no state-machine
  changes.

The local public surface deliberately mirrors the source repository's Vue API:
`SpinnerDefinition`, `useSpinnerFrame`, and a data-driven `Spinner` component.
A future npm migration should replace local imports with package imports rather
than rewrite chat behavior.

Do not add the GitHub repository as a package dependency. Its root package is
private and currently includes Expo, React, and React Native dependencies; the
Vue entry is source-only and is not exposed as a consumable package export.

## Motion and accessibility

- Advance one frame every 80ms while mounted.
- Clear the interval on unmount.
- Use a fixed-size container so Unicode glyph metrics cannot move the
  “Thinking…” label.
- On web, honor `prefers-reduced-motion: reduce` by displaying a stable frame
  and not starting the interval.
- Native Lynx currently exposes no equivalent reduced-motion signal in this
  example, so it uses the normal animation.
- Animate only text content; do not animate layout properties.

## Visual behavior

The indicator remains in the original Nuxt Chat location: immediately before
the muted “Thinking…” label while the request is submitted or the assistant
message exists without parts. It disappears as soon as reasoning, tool, or text
content begins. Completed reasoning continues to show its existing chevron and
“Thought for …” label.

## Tests

Add focused tests that prove:

1. The vendored `dots2` frames and interval match the upstream definition.
2. The composable advances frames in order with fake timers.
3. The timer is cleared on unmount.
4. Reduced-motion mode renders a stable frame without scheduling animation.
5. `Indicator.vue` delegates to the new spinner rather than retaining the old
   dot-matrix implementation.

Then run the full AI Chat suite, renderer suite, Web/Lynx production build,
lint, and dev smoke. Verify the submitted state visually in LynxExplorer's
native renderer and confirm the indicator disappears when streamed content
starts.

## Upstream package path

Create a tracking issue in `Huxpro/lynx-agent-spinners` proposing a publishable
package boundary:

- platform-neutral definitions in a dependency-free core export;
- a Vue Lynx entry with `vue`/`vue-lynx` as peer dependencies;
- package exports such as `lynx-agent-spinners/core` and
  `lynx-agent-spinners/vue`;
- no Expo or React Native packages in the Vue consumer dependency graph;
- build artifacts, type declarations, license/provenance, and a minimal
  consumption test using an external Vue Lynx app.

Until that package exists, the vendored compatibility slice is the supported
integration and records its upstream commit/source.
