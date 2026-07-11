// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Defers Vue app.mount() until Lynx's renderPage lifecycle fires.
 *
 * Used by IFR (Instant First-Frame Rendering): on the main thread the user's
 * `createApp(App).mount()` runs at bundle-evaluation time, *before* Lynx has
 * created the page (`renderPage`).  We store the mount function and expose a
 * `__vueLynxIfrMountApps` hook on globalThis; the main-thread bootstrap
 * (`vue-lynx/main-thread` ifr.ts) calls it from inside `renderPage` once the
 * page root exists.  If renderPage already fired we mount immediately.
 */

type MountFn = () => void

const pendingMounts: MountFn[] = []
let renderPageCalled = false

export function registerMount(fn: MountFn): void {
  if (renderPageCalled) {
    fn()
  } else {
    pendingMounts.push(fn)
    // Expose the trigger for the main-thread bootstrap (which lives in a
    // separate package and communicates via globalThis hooks, matching the
    // renderPage / vuePatchUpdate convention).
    ;(globalThis as Record<string, unknown>)['__vueLynxIfrMountApps'] =
      triggerRenderPage
  }
}

export function triggerRenderPage(): void {
  renderPageCalled = true
  for (const fn of pendingMounts) {
    fn()
  }
  pendingMounts.length = 0
}

/** Reset module state – for testing only. */
export function resetAppRegistry(): void {
  pendingMounts.length = 0
  renderPageCalled = false
  delete (globalThis as Record<string, unknown>)['__vueLynxIfrMountApps']
}
