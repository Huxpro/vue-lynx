// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// plugin/src (tests) and plugin/dist (bundled) both sit two levels below the
// vue-lynx package root.
const _vueLynxRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

/**
 * Absolute path the bare `vue` specifier is aliased to.
 *
 * Template-compiler output and third-party packages (vue-router, …) import
 * `"vue"`; routing it to the vue-lynx runtime keeps a single module instance
 * (singleton shared state). An absolute path — rather than the `vue-lynx`
 * package name — resolves even from importers whose `node_modules` chain
 * cannot see `vue-lynx`, e.g. dependencies inside pnpm's strict `.pnpm`
 * store, or apps that don't hoist it.
 *
 * With vapor enabled, `vue` resolves to the pure Vapor entry (the helper
 * surface compiled vapor components import, none of the vdom renderer).
 * Keep in sync with the `"."` / `"./vapor"` entries of package.json#exports.
 */
export function resolveVueAlias(vapor: boolean): string {
  return path.resolve(
    _vueLynxRoot,
    vapor ? 'runtime/dist/vapor-app.js' : 'runtime/dist/index.js',
  );
}
