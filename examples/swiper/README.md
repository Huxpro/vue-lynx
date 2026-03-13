# Swiper Example

Horizontal image swiper with three implementation variants, ported from React Lynx.

## Variants

### SwiperEmpty

Static horizontal image gallery, no touch interaction. Demonstrates basic linear layout with Lynx's `display: linear`.

### Swiper (Full)

Composable-based swiper matching React Lynx's abstraction:

- `useUpdateSwiperStyle` — containerRef + MT style setter
- `useOffset` — touch handlers + offset clamping + animation + `runOnBackground` sync
- `useAnimate` — shared RAF animation composable (in `utils/`)

### SwiperMTS

Main Thread Script touch handling for zero-latency drag. All touch event processing runs directly on the main thread via `'main thread'` directive functions, eliminating cross-thread round-trips.
