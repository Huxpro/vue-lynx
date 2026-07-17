---
"vue-lynx-genui": minor
"vue-lynx": patch
---

Add `vue-lynx-genui`: a Vue Lynx port of lynx-stack's GenUI (A2UI v0.9 and
OpenUI Lang v0.5 renderers, stores, catalogs, and prompt packages), plus two
core renderer fixes found during pixel-diff verification against upstream:
fragment/v-if anchors and empty text nodes are now layout-inert
(`display:none`) so they no longer consume flex `gap` slots, and text content
is encoded as a `raw-text` child element (ReactLynx's canonical encoding),
preserving embedded line breaks on Lynx for Web.
