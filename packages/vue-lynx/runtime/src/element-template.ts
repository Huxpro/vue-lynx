// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Element templates (compile-time-lowered static subtrees).
 *
 * The vue-lynx compiler transform lowers eligible template subtrees — plain
 * elements with static structure — into "element templates": a `create()`
 * function of straight-line PAPI calls plus a list of *holes* (interior
 * nodes carrying a dynamic prop, event, text binding, or element slot).
 * The compiled render function then produces a single vnode of type
 * `__vlx-tpl:<id>` with props `__h0…__hN` instead of one vnode per node.
 *
 * At runtime:
 *  - mounting the vnode emits ONE `INSTANTIATE_TEMPLATE` op; the main thread
 *    builds the whole subtree natively via the registered create() function
 *  - hole ids are allocated deterministically right after the root id, so
 *    every later attr/text update flows through the ordinary SET_* ops
 *  - element-slot holes (`'#slot'`) are wrapper placeholders; their content
 *    (v-if / v-for / component VNodes carried as `__hN` props) is mounted
 *    into the wrapper via INSERT/REMOVE_TEMPLATE_SLOT (slot-index addressing)
 *
 * This module is the background-thread (and IFR main-thread) side of the
 * registry. The generated code registers through the
 * `globalThis.__vueLynxRegisterElementTemplate` global (rather than an
 * import, so it is independent of which compiler copy performed codegen).
 * The compiler emits a call shaped like
 * `(globalThis.<TPL_REGISTER_GLOBAL> || noop)(id, holes, create)` — the
 * concrete shape lives in the compiler transform, not as a copy-paste
 * example here, so source-scanning MT loaders cannot mistake docs for code.
 *
 * This module installs the global at evaluation time (it evaluates before
 * any user render module — they import 'vue-lynx' first). On the
 * interpreter-only (non-IFR) main thread the render module is stripped and
 * worklet-loader-mt re-emits the registration statements verbatim;
 * entry-main installs a create-only adapter for that case.
 */

import {
  TPL_EXECUTOR_REGISTRY_GLOBAL,
  TPL_HOLE_PREFIX,
  TPL_REGISTER_GLOBAL,
  TPL_SLOT_KEY,
  TPL_TYPE_PREFIX,
} from 'vue-lynx/internal/ops';

export { TPL_HOLE_PREFIX, TPL_SLOT_KEY, TPL_TYPE_PREFIX };

/** create(pageUniqueId) → [root, hole0, hole1, …] native handles */
export type ElementTemplateCreate = (
  pageUniqueId: number,
) => unknown[];

/**
 * Template id → hole keys: the original prop key on each interior node,
 * `'#text'` for a text-content binding, or `TPL_SLOT_KEY` (`'#slot'`) for
 * an element-slot (dynamic subtree insertion point).
 */
const templateHoles = new Map<string, string[]>();

type ExecutorRegister = (
  id: string,
  create: ElementTemplateCreate,
  holes?: string[],
) => void;

/**
 * Register an element template. Called from compiler-generated code (hoisted
 * per render module, so it runs once per bundle evaluation, before any
 * render).
 *
 * Returns the template id so the generated code can hoist the call result.
 *
 * @internal — compiler-generated code only.
 * @public
 */
export function registerElementTemplate(
  id: string,
  holes: string[],
  create: ElementTemplateCreate,
): string {
  if (!templateHoles.has(id)) {
    templateHoles.set(id, holes);
  }
  // Main-thread executor registry (present on the Lynx main thread — both
  // IFR and interpreter-only bundles; absent on the background thread).
  const register = (globalThis as Record<string, unknown>)[
    TPL_EXECUTOR_REGISTRY_GLOBAL
  ] as ExecutorRegister | undefined;
  register?.(id, create, holes);
  return id;
}

/** @internal */
export function getElementTemplateHoles(id: string): string[] | undefined {
  return templateHoles.get(id);
}

// Install the registration global for compiler-generated code. Evaluated
// before any user render module (they import 'vue-lynx' first). On the IFR
// main thread this deliberately overwrites entry-main's create-only adapter
// with the full registration (hole metadata + forward to the executor
// registry).
(globalThis as Record<string, unknown>)[TPL_REGISTER_GLOBAL] =
  registerElementTemplate;
