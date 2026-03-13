# Gallery Example

A progressive tutorial demonstrating Lynx's `<list>` element, waterfall layout, and Main Thread Script scrollbar.

## Tutorial Steps

### GalleryList

Waterfall layout using `<list>` with `list-type="waterfall"` for efficient recycling of off-screen items. Displays a 2-column grid of `LikeImageCard`s.

### GalleryScrollbar

Adds a custom scrollbar driven by the Background Thread `@scroll` event. There's a small delay between scrolling and scrollbar updates due to cross-thread round-trips.

### GalleryAutoScroll

Demonstrates invoking native element methods via `lynx.createSelectorQuery().select().invoke()` to start auto-scrolling.

### GalleryScrollbarCompare

Shows a BTS scrollbar and an MTS scrollbar side by side to visually compare lag vs smoothness.

### GalleryComplete

Uses `:main-thread-bindscroll` to handle scroll events directly on the Main Thread. The worklet reads `scrollTop`/`scrollHeight` and calls `setStyleProperty` on the scrollbar thumb ref — no thread crossings.
