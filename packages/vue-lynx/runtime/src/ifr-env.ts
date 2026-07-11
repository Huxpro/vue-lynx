// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * IFR (Instant First-Frame Rendering) environment detection.
 *
 * When the vue-lynx plugin builds with `enableIFR: true`, the main-thread
 * bundle contains the full Vue runtime + user app. Its bootstrap
 * (`vue-lynx/main-thread` entry-ifr) sets `__VUE_LYNX_IFR_MT__ = true` on
 * globalThis *before* user code evaluates, so runtime modules can detect
 * that they are executing inside the main-thread first-screen render:
 *
 *   - `createApp().mount()` defers mounting until `renderPage` fires
 *   - lifecycle hooks (onMounted, ...) become no-ops (no side effects on MT)
 *   - the ops flush applies locally instead of calling `callLepusMethod`
 *
 * On the background thread (and in test environments) the flag is absent,
 * so all behavior is unchanged.
 */
export function isIfrMainThread(): boolean {
  return (
    (globalThis as { __VUE_LYNX_IFR_MT__?: unknown }).__VUE_LYNX_IFR_MT__
      === true
  );
}
