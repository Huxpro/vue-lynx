// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main Thread (Lepus) bootstrap entry.
 *
 * Injected by vue-lynx/plugin as the sole content of the
 * main-thread bundle.  Sets up:
 *   - globalThis.processData   – required by Lynx Lepus runtime (data processor)
 *   - globalThis.renderPage    – creates the Lynx page root (id=1)
 *   - globalThis.updatePage    – no-op stub (required by Lynx Lepus runtime)
 *   - globalThis.vuePatchUpdate – receives ops from Background Thread
 */

import {
  PAGE_ROOT_ID,
  TPL_EXECUTOR_REGISTRY_GLOBAL,
  TPL_REGISTER_GLOBAL,
} from 'vue-lynx/internal/ops';

import { elements, setPageUniqueId } from './element-registry.js';
import { registerTemplate } from './element-templates.js';
import { interceptPatchUpdate, runIfrRender } from './ifr.js';
import { applyOps, resetMainThreadState } from './ops-apply.js';
import { runOnBackground } from './run-on-background-mt.js';

const g = globalThis as Record<string, unknown>;

// Expose SystemInfo on globalThis (the worklet-runtime reads it).
// In React's main-thread bundle this is done by the generated snapshot code.
// Never clobber an engine-provided SystemInfo global: some environments
// (e.g. the Lynx testing environment's main-thread context) define
// `SystemInfo` directly without mirroring it on `lynx.SystemInfo` — first
// screen code that measures against screen dimensions depends on it.
g['SystemInfo'] =
  (typeof lynx !== 'undefined'
    && (lynx as { SystemInfo?: unknown }).SystemInfo)
    ?? g['SystemInfo'] ?? {};

// Register runOnBackground as a global — extracted LEPUS worklet code calls it
// as a bare identifier (the SWC transform generates `runOnBackground(_jsFnK)`).
g['runOnBackground'] = runOnBackground;

// Element-template registration hooks. Compiler-lowered template create()
// functions land here from either side:
//  - IFR bundles: vue-lynx's registerElementTemplate (which overwrites the
//    adapter below at runtime-module evaluation) forwards create() to
//    __vueLynxRegisterTemplate
//  - interpreter-only bundles: worklet-loader-mt re-emits the generated
//    registration statements, which resolve __vueLynxRegisterElementTemplate
//    at evaluation time — entry-main runs first, so they land in the
//    create-only adapter
g[TPL_EXECUTOR_REGISTRY_GLOBAL] = registerTemplate;
g[TPL_REGISTER_GLOBAL] = (
  id: string,
  _holes: unknown,
  create: Parameters<typeof registerTemplate>[1],
): string => {
  registerTemplate(id, create);
  return id;
};

// The worklet-runtime (from @lynx-js/react) is bundled into this
// main-thread entry by the vue-lynx plugin — it provides:
//   globalThis.runWorklet, globalThis.registerWorkletInternal,
//   globalThis.lynxWorkletImpl (with Element class, Animation, etc.)

// Lynx Lepus runtime requires globalThis.processData to be set.
// It is called to transform initial data before renderPage runs.
// For Vue we have no data processors, so just pass data through.
g['processData'] = function(data: unknown, _processorName?: string): unknown {
  return data ?? {};
};

// Lynx calls renderPage on the Main Thread first (before Background JS runs).
// We create the root page element and store it as id=1 so Background ops that
// target the root can resolve it correctly.
g['renderPage'] = function(_data: unknown): void {
  // Clear all element state from the previous page. This is essential for:
  // 1. Testing: prevents duplicate batch detection from skipping ops
  //    when ShadowElement IDs restart from 2 between test renders.
  // 2. Hot reload: ensures stale element handles don't persist.
  resetMainThreadState();
  const page = __CreatePage('0', 0);
  // Set global CSS scope on page so its style_sheet_manager_ is populated.
  // This matches ReactLynx 3.0's root snapshot: __SetCSSId([__page], 0).
  __SetCSSId([page], 0);
  setPageUniqueId(__GetElementUniqueID(page));
  elements.set(PAGE_ROOT_ID, page);
  // IFR: mount any Vue app that user code registered on this thread and
  // paint the first frame synchronously.  No-op in non-IFR bundles (user
  // code on the MT layer is stripped to worklet registrations, so no app
  // ever registers).
  runIfrRender();
  __FlushElementTree(page);
};

// Lynx may call updatePage / updateGlobalProps after data changes.
// We have no data binding on Main Thread, so these are no-ops.
g['updatePage'] = function(_data: unknown): void {
  // no-op: Vue Main Thread has no direct data binding
};

g['updateGlobalProps'] = function(_data: unknown): void {
  // no-op
};

// Called by the BG Thread via callLepusMethod('vuePatchUpdate', { data }).
g['vuePatchUpdate'] = function({ data }: { data: string }): void {
  // IFR hydration: the background thread's initial batches replay the
  // main-thread first-screen render — skip/patch them instead of applying.
  if (interceptPatchUpdate(data)) return;
  const ops = JSON.parse(data) as unknown[];
  applyOps(ops);
};

// Worklet registrations are included in this bundle via webpack's dependency
// graph — user code on the MT layer is processed by worklet-loader-mt which
// extracts registerWorkletInternal() calls per-entry.
