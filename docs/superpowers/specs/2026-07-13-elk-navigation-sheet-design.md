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
downward drag.

The gesture refinement also follows the current `lynx-ui` Sheet implementation
from `origin/main` (package version 3.134.0). Its relevant behaviors are an 8 px
direction-lock threshold, angle-based gesture claiming, a nonlinear rubber-band
at the fully-open boundary, velocity-projected dismissal, motion that stays on
the main thread, and backdrop opacity derived from sheet progress.

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
mount/unmount transitions, and drag-to-dismiss. It exposes a default slot and
keeps visual surface choices configurable through classes and CSS. A dedicated
28 px handle is always draggable. The scrollable content also accepts a
downward drag only while its scroll position is at the top; upward gestures and
content gestures that start while scrolled remain owned by the scroll view.

Main-thread touch handlers direction-lock after 8 px, sample drag velocity,
update the panel, handle, rubber fill, and backdrop together, and settle using
a short requestAnimationFrame spring. The background thread is contacted only
after a dismiss animation finishes. A small pure helper module owns angle
classification, nonlinear rubber resistance, velocity filtering, progress,
and dismissal decisions so the behavior can be covered by Node tests without
rendering Lynx.

`NavBottom.vue` owns Elk-specific destinations, active/disabled state, menu
rows, theme and Zen Mode actions, and route navigation. It renders the sheet as
a root-level fixed overlay whose bottom inset includes the persistent bar and
the Sparkling safe area. Guest and authenticated tab sets mirror upstream Elk
where the current port has matching routes.

## Interaction and visual details

- Backdrop opacity enters with the sheet and uses Elk's black 50% scrim.
- Panel entry is 250 ms ease-out; direct backdrop/route exit is 188 ms ease-in.
- A visible 36 × 4 px grabber sits inside a 28 px touch target at the top edge.
- The panel has Elk's 8 px top radius, 1 px top border, translucent themed
  surface, and independent vertical scrolling.
- Rows use 20 px horizontal padding, 40 px minimum height, 20 px icons, and the
  upstream active, disabled, and primary colors.
- Pressed rows and bottom tabs use short transform/opacity feedback.
- The handle claims vertical drags in either direction after 8 px. Content only
  claims a downward drag when `scrollTop` is zero, preserving natural scrolling.
- Pulling upward past the fully-open position uses the same asymptotic
  rubber-band equation as `lynx-ui` with coefficient 0.5 and an 80 px cap.
- Pulling downward follows the finger. Release dismisses after the distance
  threshold or after a deliberate minimum-distance fast fling; otherwise it
  springs back to rest without a background-thread round trip.
- Backdrop opacity follows open progress during drag and settle, rather than
  remaining fully dark until dismissal completes.
- A cancelled gesture always springs to the open position and clears captured
  direction/velocity state.
- Route changes, backdrop taps, and enabled row taps close the sheet. Disabled
  items do not navigate or close it.
- The existing Sparkling safe-area spacers remain outside the overlay, so the
  fixed bar and panel share the same safe content on iOS.

## Testing and verification

Tests first cover direction locking, hybrid content/handle ownership,
rubber-band limits, velocity filtering, distance/fling dismissal, backdrop
progress, menu structure, main-thread bindings, and the persistent More/close
state. Verification then runs the Elk native compatibility suite, the example
build, the repository checks affected by Vue SFC worklets, the Vercel mobile
preview, and real slow/fast/cancelled drags on the native bundle in iOS Lynx
Explorer with cache and app restarts.

## Scope

This change ports the Sheet primitive locally for the Elk example. It does not
publish a new public `vue-lynx` UI package or add unsupported Elk pages merely
to make disabled menu entries clickable.
