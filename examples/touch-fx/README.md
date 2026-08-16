# touch-fx — a Main Thread touch playground

A black stage, a glowing green orb, and a finger.

- **The orb chases your finger** with a damped spring, squashing and
  stretching along its velocity vector — poke it, drag it, flick it.
- **Water ripples** pulse continuously under your finger for the entire
  drag (a fresh ring every ~150 ms, endlessly re-triggerable).
- **Firework sparks** burst on touch-down and release, and an ember trail
  follows every move. Multi-touch: each extra finger splashes on its own.

Let go and the orb stays wherever you dropped it. There is one secret: the
hint line at the bottom is a switch. Press it and the orb starts springing
back to the centre instead, with the label reading `TOUCH·DRAG·FLICK` in
place of `TOUCH·DRAG·DROP`. Press it again to go back.

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
- The switch needs no gesture recognition and no timers: the hint label
  carries its own `main-thread-bindtouchstart/end`, which run before the
  stage's (touch events bubble), so the label raises a flag that makes the
  stage stand down for that gesture. Both mode labels are rendered up front
  by the Background Thread and crossfaded by opacity, so flipping the mode
  costs two style writes and never leaves the Main Thread.
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
system settles back down, that a rapid zigzag still spawns effects
(particle pool recycling), and that the hidden switch flips the release
mode both ways. Screenshots land in `harness/shots/`.

The settle check is the one that pins the default down: after a drag into a
corner, the orb has to be *there* and not at the centre.

`pnpm web:serve` serves the harness at <http://localhost:8976/> for
interactive play in a normal browser (use touch emulation in devtools).
