// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Public Vue surface. `<A2UI>` is the all-in-one component for
// developers without protocol knowledge. The composables + `NodeRenderer`
// are the contract that custom catalog components plug into.
//
// `provideA2UIContext`, `A2UIRenderer`, `A2UIContextKey`, `useA2UIContext`,
// and `useCatalog` are intentionally NOT exported — they're internal
// details of how `<A2UI>` mounts itself. Custom components don't need them.
//
// `FormContextKey` and `FormController` are also internal. `useChecks`
// reads the form context so a follow-up can introduce a `<Form>` component
// that aggregates input validity — exporting the key now would pre-commit
// the package to a provider-based API before there's a real consumer to
// validate it.
export { A2UI } from './A2UI.js';
export type { A2UIProps } from './A2UI.js';
export { NodeRenderer } from './A2UIRenderer.js';
export type { UnsupportedInfo } from './A2UIRenderer.js';
export { useAction } from './useAction.js';
export type { ActionProps } from './useAction.js';
export { useDataBinding, useResolvedProps } from './useDataBinding.js';
export { useChecks } from './useChecks.js';
export type { CheckLike } from './useChecks.js';
