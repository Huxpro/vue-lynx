// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @deprecated Use `vue-lynx/vapor-app` instead.
 *
 * This entry used to compose BOTH runtimes (vdom custom renderer + Vapor) so
 * that `createApp` could route on `__vapor` at runtime — paying ~48% extra
 * gzip for an interop scenario vue-lynx does not support. Since the mode is
 * a per-app build-time decision (`pluginVueLynx({ vapor })` picks the 'vue'
 * alias), this module is now a thin alias of the pure Vapor entry.
 *
 * If vdom↔vapor interop lands (tracked in plans/0709-1, phase 2), a true
 * composite entry will return following upstream's model: unified surface,
 * lazy renderers, `sideEffects` hygiene — with the dual-runtime cost paid
 * explicitly by importing the interop plugin.
 */

export * from './vapor-app.js';
export { createApp } from './vapor-app.js';
