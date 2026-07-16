// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Defers Vue app.mount() until Lynx's renderPage lifecycle fires.
 *
 * The user calls app.mount() at module evaluation time.  We store the mount
 * function and call it when Lynx calls globalThis.renderPage().  If
 * renderPage already fired (e.g., page reload) we mount immediately.
 */

import { completeIfrInitialRender } from './flush.js'

type MountFn = () => void

const pendingMounts: MountFn[] = []
let renderPageCalled = false

export function registerMount(fn: MountFn): void {
  if (renderPageCalled) {
    fn()
  } else {
    pendingMounts.push(fn)
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
  completeIfrInitialRender()
}

/** Reset deferred-mount state between page/test realms. */
export function resetAppRegistry(): void {
  pendingMounts.length = 0
  renderPageCalled = false
  delete (globalThis as Record<string, unknown>)['__vueLynxIfrMountApps']
}
