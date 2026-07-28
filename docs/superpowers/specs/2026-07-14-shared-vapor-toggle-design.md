# Shared VDOM/Vapor Toggle Design

## Goal

Make every supported `<Go>` on a documentation page share one VDOM/Vapor preference without navigating or refreshing the page. Switching modes reloads only the selected Lynx bundle inside the existing preview.

## Architecture

Add a small browser-side external store beside the `<Go>` wrapper. The store owns the requested render mode, exposes subscribe/getSnapshot methods for `useSyncExternalStore`, and updates `go-mode` through `history.replaceState`. It reads the initial mode from the URL and keeps the mode shared across every `<Go>` instance loaded from the same module.

`VaporAwareGo` continues to own fetched metadata and its selected entry. It derives an effective mode per entry: Vapor is used only when the shared preference is Vapor and the current entry has both Vapor bundles. Unsupported entries remain on VDOM without changing the shared preference, so moving to another supported example restores Vapor automatically.

The Rspress navigation mounts one global `Examples` renderer control and is the only place that changes the shared preference. Documentation pages and individual `<Go>` wrappers do not render additional switches. Each `<Go>` shows its effective renderer (`VDOM` or `Vapor`); an unsupported entry stays on VDOM and explains the fallback with a localized status such as `VDOM only · Uses Vue Router`.

The existing `metadataForMode` mapping swaps `dist` URLs for `dist-vapor` URLs. `@lynx-js/go-web` observes the changed metadata and updates its Web preview `src`. `WebIframe` keys only the inner `<lynx-view>` by that `src`, so the Lynx host is recreated while the documentation page, `<Go>` shell, source panel, selected tab, and scroll position remain mounted. Runtime state inside the example resets because VDOM and Vapor are separate compiled applications. A narrow `@lynx-js/web-core` compatibility guard lets standalone Vue Lynx cards skip an unavailable lifetime hook while still running normal card destruction; without it, changing the host reports an unhandled disposal error.

## URL and Navigation

- `go-mode` records the shared requested mode.
- `go-entry` remains available for entry deep links. Global mode changes preserve an existing value but do not invent an initiating entry.
- Switching uses `history.replaceState`, so it does not add history entries or trigger Rspress navigation.
- Other query parameters and the hash are preserved.
- A `popstate` listener resynchronizes the shared store when browser history changes externally.

## Error and Compatibility Behavior

- Server rendering always snapshots VDOM.
- Invalid or missing `go-mode` values fall back to VDOM.
- Unsupported entries render their existing unsupported status and VDOM bundle.
- Metadata fetch failures retain the current loading/error behavior; this change does not alter fetching.

## Interaction and Visual Design

- A compact `Examples · VDOM/Vapor` segmented control in the site navigation is the single global preference. Its `title` explains that switching resets supported previews.
- Each example exposes its effective renderer as a small non-interactive status. Unsupported reason codes are mapped to concise English and Chinese explanations and use the explicit `VDOM only` label.
- The component uses the existing Rspress surfaces, divider, text, and Vue green brand tokens in light and dark themes.
- On mobile, the `Examples` context label disappears but both renderer choices remain visible in the navigation. Coarse pointers receive 44px touch targets, keyboard focus is visible, and reduced-motion preferences disable transitions.

## Tests

Add focused Node tests for the external store covering shared subscribers, URL replacement without navigation, preservation of unrelated URL state, invalid-mode fallback, and popstate synchronization. Test that the localized global control exposes both modes, that entry statuses have no local buttons and report their effective renderer, and that no page-level toolbar is configured. Run website type/build checks and verify that the actual `<lynx-view>.url` changes between `dist` and `dist-vapor`, runtime state resets, multiple supported previews switch together while the document remains mounted, and unsupported entries remain on `dist`. Inspect English/Chinese, light/dark, and presentation down to 320px.
