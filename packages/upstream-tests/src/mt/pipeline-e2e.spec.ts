/**
 * End-to-end timing pipeline integration test.
 *
 * Verifies the plan's "first round success criterion": a VDOM update with
 * __lynx_timing_flag produces a callLepusMethod('vuePatchUpdate', ...) whose
 * payload includes pipelineOptions with the same pipelineID that was generated
 * by lynx.performance._generatePipelineOptions.
 *
 * Runs in the DOM bridge environment (vitest.dom.config.ts) which has a
 * real MT pipeline.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
import { applyOps } from '../../../vue-lynx/main-thread/src/ops-apply.js';
import {
  beginPipeline,
  captureTimingFlag,
  getCurrentPipelineID,
  markTiming,
  resetPipelineContext,
  takePipelineOptions,
} from '../../../vue-lynx/runtime/src/performance.js';

// Stub lynx.performance for BG-side pipeline API
const perfStub = {
  _generatePipelineOptions: vi.fn(),
  _onPipelineStart: vi.fn(),
  _bindPipelineIdWithTimingFlag: vi.fn(),
  _markTiming: vi.fn(),
};

beforeEach(() => {
  resetPipelineContext();
  perfStub._generatePipelineOptions.mockReset();
  perfStub._onPipelineStart.mockReset();
  perfStub._bindPipelineIdWithTimingFlag.mockReset();
  perfStub._markTiming.mockReset();
  (globalThis as any).lynx = {
    ...(globalThis as any).lynx,
    performance: perfStub,
  };
});

describe('end-to-end timing pipeline (BG + MT)', () => {
  it('full cycle: beginPipeline → captureFlag → takePipelineOptions → MT flush', () => {
    const PIPELINE_ID = 'e2e-pipeline-001';

    // 1. BG generates pipeline options (mimics scheduleFlush triggering beginPipeline)
    perfStub._generatePipelineOptions.mockReturnValue({
      pipelineID: PIPELINE_ID,
      needTimestamps: false,
    });

    beginPipeline('update');

    // Pipeline was created
    expect(getCurrentPipelineID()).toBe(PIPELINE_ID);
    expect(perfStub._onPipelineStart).toHaveBeenCalledWith(
      PIPELINE_ID,
      expect.objectContaining({ pipelineID: PIPELINE_ID }),
    );

    // vueRenderStart is marked at pipeline begin
    expect(perfStub._markTiming).toHaveBeenCalledWith(PIPELINE_ID, 'vueRenderStart');

    // 2. During patch, timing flag is captured
    captureTimingFlag('my-bench-update');

    expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledWith(
      PIPELINE_ID,
      'my-bench-update',
    );

    // 3. At flush time, take pipeline options
    markTiming('vueRenderEnd');
    markTiming('packChangesStart');
    // ... JSON.stringify happens here ...
    markTiming('packChangesEnd');

    const pipelineOptions = takePipelineOptions();

    // Options are present because flag was captured
    expect(pipelineOptions).toBeTruthy();
    expect(pipelineOptions!['pipelineID']).toBe(PIPELINE_ID);
    expect(pipelineOptions!['needTimestamps']).toBe(true);
    expect(pipelineOptions!['pipelineOrigin']).toBe('vue');
    expect(pipelineOptions!['dsl']).toBe('vue');
    expect(pipelineOptions!['stage']).toBe('update');

    // 4. Simulate MT receiving the payload and flushing with pipelineOptions
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    const childId = 600000;
    applyOps(
      [OP.CREATE, childId, 'view'],
      true,
      pipelineOptions,
    );

    // __FlushElementTree was called with the same pipelineOptions
    expect(flushSpy).toHaveBeenCalledWith(undefined, { pipelineOptions });

    // 5. After flush, reset
    resetPipelineContext();
    expect(getCurrentPipelineID()).toBeUndefined();
    expect(takePipelineOptions()).toBeUndefined();

    (globalThis as any).__FlushElementTree = origFlush;
  });

  it('unflagged update does NOT produce pipelineOptions', () => {
    perfStub._generatePipelineOptions.mockReturnValue({
      pipelineID: 'e2e-no-flag',
      needTimestamps: false,
    });

    beginPipeline('update');
    // No captureTimingFlag call — update without timing flag
    const opts = takePipelineOptions();
    expect(opts).toBeUndefined();

    // MT flush should be bare
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    applyOps([OP.CREATE, 600001, 'text'], true, opts);
    expect(flushSpy).toHaveBeenCalledWith();

    (globalThis as any).__FlushElementTree = origFlush;
    resetPipelineContext();
  });

  it('setup pipeline precedes update (no double pipeline)', () => {
    perfStub._generatePipelineOptions.mockReturnValue({
      pipelineID: 'setup-first',
      needTimestamps: false,
    });

    // Setup pipeline starts first (as triggerRenderPage would do)
    beginPipeline('setup');
    expect(getCurrentPipelineID()).toBe('setup-first');

    // scheduleFlush's beginPipeline('update') is idempotent
    beginPipeline('update');
    expect(getCurrentPipelineID()).toBe('setup-first');
    expect(perfStub._generatePipelineOptions).toHaveBeenCalledTimes(1);

    // Stage should still be 'setup'
    const opts = takePipelineOptions();
    // No flag captured, so undefined
    expect(opts).toBeUndefined();

    resetPipelineContext();
  });

  it('all diagnostic marks are recorded in correct order', () => {
    perfStub._generatePipelineOptions.mockReturnValue({
      pipelineID: 'marks-order',
      needTimestamps: false,
    });

    beginPipeline('update');
    captureTimingFlag('bench');

    markTiming('vueRenderEnd');
    markTiming('packChangesStart');
    markTiming('packChangesEnd');

    const calls = perfStub._markTiming.mock.calls;
    const marks = calls.map((c: unknown[]) => c[1]);

    expect(marks).toEqual([
      'vueRenderStart',  // from beginPipeline
      'vueRenderEnd',
      'packChangesStart',
      'packChangesEnd',
    ]);

    // All marks use the same pipeline ID
    const ids = calls.map((c: unknown[]) => c[0]);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBe('marks-order');

    resetPipelineContext();
  });
});
