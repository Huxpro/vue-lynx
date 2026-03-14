# Transition Example

Exercises `<Transition>` and `<TransitionGroup>` components with CSS class-based enter/leave animations.

## Scenarios Covered

See `src/App.vue`:

1. Basic fade (CSS transition)
2. Named slide-fade (CSS transition)
3. Bounce (CSS `@keyframes` animation)
4. Transition `mode="out-in"` (component switch)
5. Transition with `appear`
6. Explicit `:duration` prop
7. `<TransitionGroup>` — list enter/leave
8. JS hooks (`onBeforeEnter` / `onEnter` / `onLeave`)

## Caveats

- Always set `:duration` — `getComputedStyle()` is unavailable from the background thread
- Move (FLIP) animations in `<TransitionGroup>` are not supported — `getBoundingClientRect()` is unavailable
