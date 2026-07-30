# touch-fx — a Main Thread touch playground

A black stage, a glowing green orb, and a finger.

- **The orb chases your finger** with a damped spring, squashing and
  stretching along its velocity vector — poke it, drag it, flick it.
- **Water ripples** pulse continuously under your finger for the entire
  drag (a fresh ring every ~150 ms, endlessly re-triggerable).
- **Firework sparks** burst on touch-down and release, and an ember trail
  follows every move. Multi-touch: each extra finger splashes on its own.

Everything animated — orb spring physics, ripple rings, spark particles —
runs **on the Main Thread** via `'main thread'` worklets and a
`requestAnimationFrame` loop, so there is zero BG↔MT round-trip between
your finger and the pixels. The Background Thread only renders the static
element pools once at startup.

## How it works

- `src/App.vue` — one `MainThreadRef` per pooled element (10 ripples,
  64 sparks, orb layers) plus one `engRef` holding the whole engine state
  on the Main Thread. Touch handlers (`main-thread-bindtouchstart/move/end`)
  feed finger positions in; a self-rescheduling rAF loop integrates the
  spring + particles and writes styles via `setStyleProperty`. The loop
  parks itself when everything settles and wakes on the next touch.
- `src/touch-fx.css` — the look: layered radial gradients for the orb,
  a CSS `breathe` keyframe for the idle glow (independent of the MT
  transform, which lives on a different element).

## Run it

```bash
pnpm dev        # LynxExplorer / native
pnpm build      # produces dist/main.{lynx,web}.bundle
```

## Verify on the web (headless)

```bash
pnpm build
pnpm web:verify   # builds nothing; drives real CDP touch events in
                  # headless Chromium and pixel-checks the effects
```

`harness/verify.mjs` performs a 4-second circular drag and asserts that
green effect pixels track the finger at **every** sample along the way
(the continuity requirement), that fireworks fire on release, that the
system settles back to idle, and that a rapid zigzag still spawns effects
(particle pool recycling). Screenshots land in `harness/shots/`.

`pnpm web:serve` serves the harness at <http://localhost:8976/> for
interactive play in a normal browser (use touch emulation in devtools).
