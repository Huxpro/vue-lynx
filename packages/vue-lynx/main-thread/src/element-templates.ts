// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-thread element-template registry.
 *
 * Element templates are compile-time-lowered static subtrees: a create()
 * function of straight-line PAPI calls returning `[root, hole0, hole1, …]`.
 * They are registered at bundle-evaluation time — before any renderPage or
 * ops batch — through `globalThis.__vueLynxRegisterTemplate` (installed by
 * entry-main):
 *
 *  - IFR bundles: the full render module runs on this thread; the runtime's
 *    `registerElementTemplate` forwards the create() here.
 *  - Interpreter-only bundles: worklet-loader-mt extracts the hoisted
 *    registration statements from the compiled render module, which call the
 *    same global.
 *
 * The registry is intentionally NOT cleared by resetMainThreadState():
 * registration happens once per bundle evaluation while renderPage may run
 * multiple times (reload, tests).
 */

type CreateFn = (pageUniqueId: number) => LynxElement[];

const templates = new Map<string, CreateFn>();

export function registerTemplate(id: string, create: CreateFn): void {
  if (!templates.has(id)) {
    templates.set(id, create);
  }
}

export function getTemplate(id: string): CreateFn | undefined {
  return templates.get(id);
}

/** Reset registry — for testing only. */
export function resetTemplatesForTesting(): void {
  templates.clear();
}
