// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { VNodeChild } from '@vue/runtime-core';

/**
 * Loose Vue component type for catalog entries. Entries receive
 * runtime-shaped props from the protocol stream, so per-component prop
 * typing isn't enforced here — mirrors upstream's
 * `ComponentType<GenericComponentProps>`.
 *
 * Catalog components are either plain functional components
 * `(props) => VNodeChild` or `defineComponent(...)` objects; both are
 * renderable via `h()`.
 */
// biome-ignore lint/suspicious/noExplicitAny: ported upstream API is typed with `any`
export type GenUIComponent = any;

/**
 * Render output alias used across ported components — the Vue analogue of
 * upstream's `ReactNode` return type.
 */
export type RenderNode = VNodeChild;
