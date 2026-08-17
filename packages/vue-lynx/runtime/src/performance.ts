// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Background Thread half of the Lynx Performance API integration.
 *
 * Owns the *framework-initiated* pipeline: every scheduler tick that produces
 * ops asks the engine for a fresh `PipelineOptions`, starts it, marks the
 * framework rendering stages that happen on this thread, and hands the whole
 * object to {@link takePipeline} so `flush.ts` can ship it to the main thread
 * with the batch it describes.
 *
 * Two rules shape everything here:
 *
 *  1. **One pipeline per logical change, carried to its own flush.** The
 *     context is created when a tick starts producing mutations and released
 *     when that tick's batch leaves the thread. It is never reused, and a tick
 *     that produces no batch never creates one.
 *  2. **The first batch is not ours.** Lynx starts a `loadBundle` pipeline
 *     before any framework code runs and hands it to the main thread's
 *     `renderPage`. In a non-IFR build the page that `renderPage` creates is
 *     empty — the first screen is the background thread's first batch — so
 *     that batch must ride the *engine's* load pipeline, not a framework one.
 *     The main thread arbitrates (see `main-thread/src/performance.ts`); this
 *     side simply does not open a pipeline for its first flush.
 *
 * This module is renderer-agnostic on purpose: it hooks the ops pipeline
 * (`scheduleFlush` / `doFlush`), which both the virtual-DOM renderer and Vapor
 * funnel every mutation through.
 */

import {
  DSL_VUE,
  type FrameworkTimingKey,
  PIPELINE_ORIGIN_UPDATE_BTS,
  PIPELINE_STAGE_UPDATE,
  type PipelineOptions,
  TIMING_FLAG_ATTR,
} from 'vue-lynx/internal/ops';

import { isIfrMainThread } from './ifr-env.js';

// `lynx` is injected by RuntimeWrapperWebpackPlugin as a parameter to the
// tt.define() AMD callback — it is NOT on globalThis. Declare it ambiently so
// TypeScript accepts the bare identifier, and read it through `typeof` guards
// so non-Lynx realms (vitest, the web preview) stay silent no-ops.
// eslint-disable-next-line no-var
declare var lynx:
  | {
    performance?: {
      _generatePipelineOptions?(): PipelineOptions | undefined;
      _onPipelineStart?(pipelineID: string, options?: PipelineOptions): void;
      _markTiming?(pipelineID: string, key: string): void;
      _bindPipelineIdWithTimingFlag?(
        pipelineID: string,
        timingFlag: string,
      ): void;
    };
  }
  | null
  | undefined;

type LynxPerformance = NonNullable<
  NonNullable<typeof lynx>['performance']
>;

function performanceApi(): LynxPerformance | undefined {
  if (typeof lynx === 'undefined' || !lynx) return undefined;
  return lynx.performance;
}

/**
 * `_onPipelineStart(pipelineID, options)` — the two-argument form that carries
 * `dsl`/`stage`/`pipelineOrigin` — landed in Lynx 3.1. Older engines accept
 * only the id, and passing a second argument to them is not defined behavior.
 */
function supportsPipelineStartOptions(): boolean {
  const info = (globalThis as { SystemInfo?: { lynxSdkVersion?: string } })
    .SystemInfo;
  const version = info?.lynxSdkVersion;
  if (!version) return false;
  const parts = version.split('.');
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  if (Number.isNaN(major)) return false;
  return major > 3 || (major === 3 && minor >= 1);
}

let current: PipelineOptions | undefined;
let dsl: string = DSL_VUE;
let firstBatchDispatched = false;

/**
 * Override the `dsl` reported for framework-initiated pipelines.
 *
 * The ops protocol is shared by the virtual-DOM renderer and Vapor, but they
 * are different rendering strategies with different cost profiles — reporting
 * them under one identifier would make the two indistinguishable in pipeline
 * data. Vapor calls this at app-creation time.
 */
export function setFrameworkDsl(value: string): void {
  dsl = value;
}

/**
 * Open a framework-initiated pipeline for the tick that is about to produce
 * ops. Called from `scheduleFlush()` on the transition into "a batch is
 * pending", which is the first tree mutation of the tick.
 *
 * Idempotent within a tick, and a no-op when the engine has no Performance
 * API, when this realm is the IFR main thread (the engine's load pipeline
 * owns that render), or for the first batch (see the module comment).
 */
export function beginUpdatePipeline(): void {
  if (current !== undefined) return;
  if (!firstBatchDispatched) return;
  if (isIfrMainThread()) return;

  const perf = performanceApi();
  if (!perf || !perf._generatePipelineOptions || !perf._onPipelineStart) return;

  const options = perf._generatePipelineOptions();
  if (!options) return;

  options.pipelineOrigin = PIPELINE_ORIGIN_UPDATE_BTS;
  // Detailed timing is opt-in per pipeline: raised only when the batch turns
  // out to carry a Timing Flag (see observeTimingFlagProp). Marking every
  // update would report timestamps for every keystroke.
  options.needTimestamps = false;
  options.dsl = dsl;
  options.stage = PIPELINE_STAGE_UPDATE;

  current = options;
  if (supportsPipelineStartOptions()) {
    perf._onPipelineStart(options.pipelineID, options);
  } else {
    perf._onPipelineStart(options.pipelineID);
  }

  // The diff window opens *before* the flag that enables timestamps can be
  // discovered — this mark is forced so a flagged pipeline still reports a
  // start. `force` is exactly what ReactLynx does for the same reason.
  markTiming('diffVdomStart', true);
}

/**
 * Record a framework rendering timing point on the open pipeline.
 *
 * The engine samples the wall clock when this is called; a timestamp is never
 * passed in. Marks are dropped when no pipeline is open or when the pipeline
 * did not ask for timestamps.
 */
export function markTiming(
  key: FrameworkTimingKey,
  force = false,
): void {
  const options = current;
  if (!options) return;
  if (!force && !options.needTimestamps) return;
  const perf = performanceApi();
  if (!perf || !perf._markTiming) return;
  perf._markTiming(options.pipelineID, key);
}

/**
 * Raise `needTimestamps` when a prop write puts an application Timing Flag
 * into the batch under construction.
 *
 * The framework does *not* bind the flag to the pipeline: the engine reads
 * `__lynx_timing_flag` off the element once it is applied and uses it as the
 * `PipelineEntry.identifier` itself. Binding here as well would attribute the
 * same flag twice. (`_bindPipelineIdWithTimingFlag` exists for flags a
 * framework synthesizes, which Vue Lynx has none of.)
 */
export function observeTimingFlagProp(key: string, value: unknown): void {
  if (key !== TIMING_FLAG_ATTR) return;
  if (value === undefined || value === null || value === '') return;
  // The flag may be the very first mutation of the tick, in which case the
  // renderer has not reached its `scheduleFlush()` yet. Opening the pipeline
  // here is idempotent and keeps the mark order correct.
  beginUpdatePipeline();
  if (current === undefined) return;
  current.needTimestamps = true;
}

/**
 * Hand the open pipeline to the batch that is leaving the thread, closing it
 * on this side. Returns `undefined` when no pipeline is open — an ordinary
 * outcome for the first batch and for engines without the Performance API.
 */
export function takePipeline(): PipelineOptions | undefined {
  const options = current;
  current = undefined;
  return options;
}

/**
 * Discard the open pipeline without committing it.
 *
 * Used when a tick's batch cannot be submitted after all, so the context can
 * never be attached to an unrelated later update.
 */
export function dropPipeline(): void {
  current = undefined;
}

/**
 * Record that a batch has left this thread. Until this has happened once, the
 * engine's `loadBundle` pipeline still owns the first screen and this side
 * must not open one of its own.
 */
export function notePipelineBatchDispatched(): void {
  firstBatchDispatched = true;
}

/** Whether a framework-initiated pipeline is currently open. */
export function hasOpenPipeline(): boolean {
  return current !== undefined;
}

/** Reset module state – for testing only. */
export function resetPerformanceState(): void {
  current = undefined;
  dsl = DSL_VUE;
  firstBatchDispatched = false;
}
