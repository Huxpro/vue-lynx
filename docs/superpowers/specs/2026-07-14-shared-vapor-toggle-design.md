# Shared VDOM/Vapor Toggle Design

## Goal

Make every supported `<Go>` on a documentation page share one VDOM/Vapor preference without navigating or refreshing the page. Switching modes reloads only the selected Lynx bundle inside the existing preview.

## Architecture

Add a small browser-side external store beside the `<Go>` wrapper. The store owns the requested render mode, exposes subscribe/getSnapshot methods for `useSyncExternalStore`, and updates `go-mode` plus the initiating `go-entry` through `history.replaceState`. It reads the initial mode from the URL and keeps the mode shared across every `<Go>` instance loaded from the same module.

`VaporAwareGo` continues to own fetched metadata and its selected entry. It derives an effective mode per entry: Vapor is used only when the shared preference is Vapor and the current entry has both Vapor bundles. Unsupported entries remain on VDOM without changing the shared preference, so moving to another supported example restores Vapor automatically.

The existing `metadataForMode` mapping swaps `dist` URLs for `dist-vapor` URLs. `@lynx-js/go-web` observes the changed metadata and updates its Web preview `src`; its `WebIframe` then assigns the new bundle URL to the existing `<lynx-view>`. The documentation page, source panel, selected tab, and scroll position remain mounted. Runtime state inside the example resets because VDOM and Vapor are separate compiled applications.

## URL and Navigation

- `go-mode` records the shared requested mode.
- `go-entry` records which example initiated the last mode switch, preserving existing deep-link semantics.
- Switching uses `history.replaceState`, so it does not add history entries or trigger Rspress navigation.
- Other query parameters and the hash are preserved.
- A `popstate` listener resynchronizes the shared store when browser history changes externally.

## Error and Compatibility Behavior

- Server rendering always snapshots VDOM.
- Invalid or missing `go-mode` values fall back to VDOM.
- Unsupported entries render their existing unsupported status and VDOM bundle.
- Metadata fetch failures retain the current loading/error behavior; this change does not alter fetching.

## Tests

Add focused Node tests for the external store covering shared subscribers, URL replacement without navigation, preservation of unrelated URL state, invalid-mode fallback, and popstate synchronization. Run website type/build checks and manually verify two supported `<Go>` instances switch together while the document remains mounted.
