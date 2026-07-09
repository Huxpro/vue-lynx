// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * vue-lynx entry with Vapor mode enabled.
 *
 * When `pluginVueLynx({ vapor: true })` is set, the build plugin aliases
 * 'vue' to this module instead of the default entry, so that compiled Vapor
 * component code (which imports helpers like `template`/`renderEffect`/
 * `createComponent` from 'vue') resolves alongside the regular vue-lynx API.
 *
 * Mirrors how `vue`'s own bundler entry composes `@vue/runtime-dom` +
 * `@vue/runtime-vapor`.
 */

export * from './index.js';
export * from './vapor/index.js';

// Both ./index.js (runtime-core's) and ./vapor/index.js (runtime-vapor's)
// export `withAsyncContext`, which would make the star re-exports above
// silently drop the name. Pick the Vapor version explicitly — it delegates
// to the core implementation for non-vapor components, exactly like the
// upstream `vue` bundle does.
export { withAsyncContext } from './vapor/index.js';

import type { Component } from '@vue/runtime-core';

import { createApp as createVdomApp } from './index.js';
import type { VueLynxApp } from './index.js';
import { createVaporApp } from './vapor/index.js';

/**
 * Create a Vue Lynx application. Routes to the Vapor runtime when the root
 * component is a Vapor component (`<script setup vapor>`), and to the vdom
 * custom renderer otherwise.
 *
 * @public
 */
export function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown>,
): VueLynxApp {
  if ((rootComponent as { __vapor?: boolean }).__vapor) {
    return createVaporApp(rootComponent, rootProps);
  }
  return createVdomApp(rootComponent, rootProps);
}
