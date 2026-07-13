# Elk Navigation Sheet Design

## Goal

Bring the Vue Lynx Elk mobile navigation to behavioral and visual parity with
the upstream `elk-zone/elk` bottom navigation and More sheet on Lynx Web and
native iOS Lynx Explorer.

## Reference behavior

The reference is upstream Elk commit `d444a59`, run locally with the mocked
development data at a 390 × 844 viewport. Guest navigation contains Explore,
Local, Federated, and More. Opening More leaves the bottom bar fixed, changes
the More icon to the primary-colored close icon, dims the timeline, and raises
a rounded sheet above the bar. The sheet height is capped so roughly 200 px of
the viewport remains outside the panel. Its content scrolls independently and
can be dismissed through the backdrop, the close button, navigation, or a
downward drag of 120 px.

## Considered approaches

1. Copy only the upstream CSS transition into `NavBottom.vue`. This is small,
   but couples panel state, navigation, and drag behavior into one component
   and makes native gesture work happen on the background thread.
2. Depend directly on `@lynx-js/lynx-ui-sheet`. This preserves the official
   primitive, but it is a ReactLynx package whose hooks and context cannot be
   consumed by Vue Lynx.
3. Port the official primitive's state and gesture model into a reusable Vue
   Lynx component, then style its content for Elk. This keeps the sheet generic,
   gives native drag work to main-thread worklets, and lets Elk own its exact
   navigation appearance. This is the selected approach.

## Architecture

`components/sheet/Sheet.vue` owns controlled visibility, backdrop dismissal,
mount/unmount transitions, and downward drag-to-dismiss. It exposes a default
slot and keeps visual surface choices configurable through classes and CSS.
Main-thread touch handlers update only `transform` and `transition` on the
panel. A small pure helper module owns drag clamping and dismissal decisions so
the behavior can be covered by Node tests without rendering Lynx.

`NavBottom.vue` owns Elk-specific destinations, active/disabled state, menu
rows, theme and Zen Mode actions, and route navigation. It renders the sheet as
an absolute overlay in the existing safe-content containing block so the panel
ends above the persistent bottom bar. Guest and authenticated tab sets mirror
upstream Elk where the current port has matching routes.

## Interaction and visual details

- Backdrop opacity enters with the sheet and uses Elk's black 50% scrim.
- Panel entry is 250 ms ease-out; exit is 188 ms ease-in.
- The panel has Elk's 8 px top radius, 1 px top border, translucent themed
  surface, and independent vertical scrolling.
- Rows use 20 px horizontal padding, 40 px minimum height, 20 px icons, and the
  upstream active, disabled, and primary colors.
- Pressed rows and bottom tabs use short transform/opacity feedback.
- Drag follows the finger on the main thread, never moves upward past rest,
  dismisses at 120 px, and otherwise snaps back.
- Route changes, backdrop taps, and enabled row taps close the sheet. Disabled
  items do not navigate or close it.
- The existing Sparkling safe-area spacers remain outside the overlay, so the
  fixed bar and panel share the same safe content on iOS.

## Testing and verification

Tests first cover drag clamping, the exact dismissal boundary, menu structure,
main-thread bindings, and the persistent More/close state. Verification then
runs the Elk native compatibility suite, the example build, the repository
checks affected by Vue SFC worklets, the Vercel mobile preview, and the native
bundle in iOS Lynx Explorer with cache and app restarts.

## Scope

This change ports the Sheet primitive locally for the Elk example. It does not
publish a new public `vue-lynx` UI package or add unsupported Elk pages merely
to make disabled menu entries clickable.
