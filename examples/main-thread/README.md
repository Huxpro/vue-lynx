# Main Thread Examples

Demonstrates Main Thread Script APIs for zero-latency UI updates, ported from the React Lynx draggable examples.

## Entries

### background-draggable

A box that tracks scroll position, updated entirely through Vue's reactive system on the Background Thread — no Main Thread APIs. Serves as a baseline to show the latency of cross-thread round-trips.

### main-thread-draggable

Left half: scroll-view with large colored blocks. Right half: two boxes that track scroll position (start at y=500, move up):

- **MTDraggable** — updated directly on Main Thread via `setStyleProperty` (smooth)
- **BGDraggable** — updated via Background Thread reactive state (laggy)

Uses the `'main thread'` directive with SWC worklet transform.

### main-thread-draggable-raw

Same demo as above but using raw worklet context objects instead of the SWC transform. Requires matching `registerWorkletInternal()` calls in `entry-main.ts`. Compare with `main-thread-draggable/` for the transform-based version.
