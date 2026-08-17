// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main Thread half of the Lynx Performance API integration.
 *
 * This side never creates a pipeline. It receives them — from the engine
 * (`renderPage`, `updatePage`, `updateGlobalProps`) and from the background
 * thread (`vuePatchUpdate`) — marks the framework rendering stages that happen
 * here, and attaches the right one to the `__FlushElementTree` call that
 * actually submits the corresponding content.
 *
 * ## Which pipeline rides which flush
 *
 * Two can be in play at once, so this module arbitrates:
 *
 * - **The load pipeline** is engine-initiated and arrives at `renderPage`. In
 *   a non-IFR build `renderPage` creates nothing but an empty page root, which
 *   is a placeholder in the Performance API's sense — the first screen is the
 *   background thread's first batch. So the load pipeline is *retained* and
 *   attached to the first flush that submits real content. An empty batch, a
 *   duplicate batch, or a reload must not consume it.
 * - **An update pipeline** is framework-initiated on the background thread and
 *   travels with the batch it describes.
 *
 * When both are present the load pipeline wins: it is the one that produces
 * `pipeline.loadBundle` and the first-screen metrics, and the background
 * thread deliberately does not open a pipeline for its first batch (see
 * `runtime/src/performance.ts`) so this case only arises if a build reorders
 * the handshake.
 *
 * ## LEPUS constraints
 *
 * The main-thread bundle is compiled to ES2019 bytecode: no optional chaining,
 * no nullish coalescing. Everything here is written accordingly.
 */

import type {
  FlushOptions,
  FrameworkTimingKey,
  PipelineOptions,
} from 'vue-lynx/internal/ops';

/**
 * `lynx` in the Lepus realm. Typed locally rather than through the shared
 * shim so the Performance API surface is explicit, and read through `typeof`
 * guards so the web preview and unit tests stay silent no-ops.
 */
interface LynxPerformanceApi {
  _markTiming?: (pipelineID: string, key: string) => void;
}

function performanceApi(): LynxPerformanceApi | undefined {
  if (typeof lynx === 'undefined' || !lynx) return undefined;
  return (lynx as { performance?: LynxPerformanceApi }).performance;
}

/** Pipeline carried by the batch currently being applied. */
let current: PipelineOptions | undefined;

/** Engine load pipeline awaiting the flush that submits the first screen. */
let pendingLoad: PipelineOptions | undefined;

/**
 * Adopt the pipeline that arrived with the batch about to be applied. Pass
 * `undefined` when the batch carries none (old background bundle, or the
 * background thread's first batch).
 */
export function setPipeline(options: PipelineOptions | undefined): void {
  current = options;
}

/**
 * Retain an engine-initiated load pipeline until real content is submitted.
 *
 * Called from `renderPage` with `options.pipelineOptions`. A second call
 * replaces the previous one: `renderPage` firing again means the old page is
 * gone, and its pipeline with it.
 */
export function setPendingLoadPipeline(
  options: PipelineOptions | undefined,
): void {
  pendingLoad = options;
}

/**
 * Record a framework rendering timing point on the pipeline being applied.
 * The engine samples the clock at the call; no timestamp is passed in.
 */
export function markTiming(key: FrameworkTimingKey, force?: boolean): void {
  const options = current;
  if (!options) return;
  if (!force && !options.needTimestamps) return;
  const perf = performanceApi();
  if (!perf || !perf._markTiming) return;
  perf._markTiming(options.pipelineID, key);
}

/**
 * Take the pipeline that the *next* real-content flush should carry, clearing
 * it so it can never be attached to a second submission.
 */
export function takeFlushPipeline(): PipelineOptions | undefined {
  let options = pendingLoad;
  if (options) {
    pendingLoad = undefined;
    // A batch that also carried an update pipeline loses it here: one flush
    // submits one pipeline, and the load pipeline is the meaningful one.
    current = undefined;
    return options;
  }
  options = current;
  current = undefined;
  return options;
}

/**
 * Submit pending element changes, associating them with the pipeline that
 * produced them.
 *
 * `root` mirrors the flush scope the caller already used before performance
 * integration existed — the integration must never change it. `extra` carries
 * flush options the caller owns (engine-provided update options, for
 * instance); `pipelineOptions` is merged in without overwriting them.
 */
export function flushElementTree(
  root?: LynxElement,
  extra?: FlushOptions,
): void {
  const pipelineOptions = takeFlushPipeline();
  if (!pipelineOptions && !extra) {
    // Preserve the exact pre-integration call shape when there is nothing to
    // associate: `__FlushElementTree()` and `__FlushElementTree(root)` are the
    // calls this renderer has always made.
    if (root) {
      __FlushElementTree(root);
    } else {
      __FlushElementTree();
    }
    return;
  }

  const options: FlushOptions = {};
  if (extra) {
    for (const key in extra) options[key] = extra[key];
  }
  if (pipelineOptions) options.pipelineOptions = pipelineOptions;

  // The two-argument overload needs a root. The page is the scope every
  // pipeline-carrying flush in this renderer already used, whether it was
  // spelled `__FlushElementTree()` (whole tree) or `__FlushElementTree(page)`.
  __FlushElementTree(root ? root : getPageElement(), options);
}

let pageElement: LynxElement | undefined;

/** Remember the page root so pipeline-carrying flushes have a scope to name. */
export function setPageElement(page: LynxElement): void {
  pageElement = page;
}

function getPageElement(): LynxElement {
  // `renderPage` always runs before any flush, so this is set in practice.
  return pageElement as LynxElement;
}

/**
 * Drop every pipeline held by this thread.
 *
 * Reload and page destruction invalidate a retained load pipeline: the content
 * it was waiting for will never be submitted, and attaching it to the *next*
 * page's first batch would attribute one page's pixels to another's load.
 */
export function dropPipelines(): void {
  current = undefined;
  pendingLoad = undefined;
}

/** Whether a load pipeline is still waiting for real content. */
export function hasPendingLoadPipeline(): boolean {
  return pendingLoad !== undefined;
}

/** Reset module state – for testing only. */
export function resetPerformanceState(): void {
  current = undefined;
  pendingLoad = undefined;
  pageElement = undefined;
}
