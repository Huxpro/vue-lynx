// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Batch-scoped performance pipeline context.
 *
 * Bridges Vue Lynx render/update batches to the Lynx native performance
 * pipeline so that benchmark timing flags produce proper native Render Time
 * samples (measure → layout → draw) attributable to each flagged update.
 *
 * The pipeline lifecycle:
 *   1. beginPipeline(stage) — before Vue render/patch begins
 *   2. captureTimingFlag(value) — when __lynx_timing_flag is seen during patch
 *   3. markTiming(key) — at diagnostic boundaries (vueRenderStart, etc.)
 *   4. takePipelineOptions() — at flush time, returns options for the MT payload
 *   5. resetPipelineContext() — after flush delivery, clears for next batch
 *
 * All calls are safe no-ops when the Lynx performance API is unavailable.
 */

// The BG `lynx` variable is AMD-injected; see flush.ts pattern.
// eslint-disable-next-line no-var
declare var lynx:
  | {
    performance?: {
      _generatePipelineOptions?(): Record<string, unknown>;
      _onPipelineStart?(pipelineID: string, options: Record<string, unknown>): void;
      _bindPipelineIdWithTimingFlag?(pipelineID: string, timingFlag: string): void;
      _markTiming?(pipelineID: string, timingKey: string): void;
    };
  }
  | null
  | undefined;

export const TIMING_FLAG_PROP = '__lynx_timing_flag';

// ---------------------------------------------------------------------------
// Pipeline context state (one active batch at a time)
// ---------------------------------------------------------------------------

let pipelineID: string | undefined;
let pipelineOptions: Record<string, unknown> | undefined;
let timingFlag: string | undefined;
let flagBound = false;
let multipleFlags = false;

// ---------------------------------------------------------------------------
// Capability detection
// ---------------------------------------------------------------------------

function getPerf() {
  if (typeof lynx === 'undefined') return undefined;
  return lynx?.performance;
}

function hasCapability(): boolean {
  const perf = getPerf();
  return !!(perf?._generatePipelineOptions);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start a new pipeline for this scheduler tick (setup or update).
 * Must be called BEFORE Vue's render/patch phase so that framework render
 * cost is included inside the pipeline boundary.
 */
export function beginPipeline(stage: 'setup' | 'update'): void {
  if (pipelineID !== undefined) return; // already active for this batch
  if (!hasCapability()) return;

  const perf = getPerf()!;
  const opts = perf._generatePipelineOptions!();
  if (!opts || typeof opts !== 'object') return;

  const id = (opts as { pipelineID?: string }).pipelineID;
  if (!id) return;

  pipelineID = id;
  pipelineOptions = opts;
  timingFlag = undefined;
  flagBound = false;
  multipleFlags = false;

  perf._onPipelineStart?.(id, opts);

  // Store origin metadata matching ReactLynx semantics
  (opts as Record<string, unknown>)['pipelineOrigin'] ??= 'vue';
  (opts as Record<string, unknown>)['dsl'] ??= 'vue';
  (opts as Record<string, unknown>)['stage'] ??= stage;
}

/**
 * Capture a `__lynx_timing_flag` value observed during the current batch.
 * First non-empty flag wins; conflicting flags produce a dev-mode warning.
 */
export function captureTimingFlag(value: unknown): void {
  if (value == null || value === '') return;
  const flag = String(value);

  if (timingFlag !== undefined) {
    if (timingFlag === flag) return; // same flag, idempotent
    if (!multipleFlags) {
      multipleFlags = true;
      if (__DEV__) {
        console.warn(
          `[vue-lynx] Multiple different __lynx_timing_flag values in one batch: `
            + `"${timingFlag}" (kept) vs "${flag}" (ignored). `
            + `Only one flag per update batch is supported.`,
        );
      }
    }
    return;
  }

  timingFlag = flag;

  if (pipelineID && !flagBound) {
    flagBound = true;
    const perf = getPerf();
    perf?._bindPipelineIdWithTimingFlag?.(pipelineID, flag);
    // Enable timestamp collection for flagged pipelines
    if (pipelineOptions) {
      (pipelineOptions as Record<string, unknown>)['needTimestamps'] = true;
    }
  }
}

/**
 * Record a diagnostic timing mark on the current pipeline.
 */
export function markTiming(key: string): void {
  if (!pipelineID) return;
  const perf = getPerf();
  perf?._markTiming?.(pipelineID, key);
}

/**
 * Take the pipeline options for inclusion in the flush payload.
 * Returns undefined if no pipeline is active or no flag was captured.
 * Only flagged pipelines produce benchmark-visible samples.
 */
export function takePipelineOptions(): Record<string, unknown> | undefined {
  if (!pipelineID || !timingFlag) return undefined;
  return pipelineOptions;
}

/**
 * Returns the current pipeline ID (for test assertions).
 */
export function getCurrentPipelineID(): string | undefined {
  return pipelineID;
}

/**
 * Returns whether a timing flag was captured in the current batch.
 */
export function hasTimingFlag(): boolean {
  return timingFlag !== undefined;
}

/**
 * Reset all pipeline state. Called after flush delivery completes.
 */
export function resetPipelineContext(): void {
  pipelineID = undefined;
  pipelineOptions = undefined;
  timingFlag = undefined;
  flagBound = false;
  multipleFlags = false;
}
