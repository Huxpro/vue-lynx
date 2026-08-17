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
9. Registry cleanup — no-`duration` Transition + hammer toggle ([#286](https://github.com/Huxpro/vue-lynx/issues/286))

## Caveats

- `<Transition>` has no Lynx-specific limitations — CSS transitions/animations work with or without `:duration` (event + bounded fallback cleanup).
- Move (FLIP) animations in `<TransitionGroup>` are not supported — `getBoundingClientRect()` is unavailable from the background thread
