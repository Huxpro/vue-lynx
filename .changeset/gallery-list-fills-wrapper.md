---
"vue-lynx": patch
---

Let the gallery example's list fill its wrapper instead of leaving a 48px black band.

`.list` was `height: calc(100% - 48px)` inside a black `.gallery-wrapper`, and every scrollbar step derived its viewport from `SystemInfo.pixelHeight / SystemInfo.pixelRatio - 48`. That 48 is Lynx Explorer's title bar, but `100%` is already the page area below it, so the example subtracted it twice — leaving the band on Lynx for Web, in Explorer's fullscreen mode, and under the title bar itself. The scrollbar now takes its viewport from `event.detail.listHeight`, the list's own box, falling back to the page height where Lynx for Web reports 0.
