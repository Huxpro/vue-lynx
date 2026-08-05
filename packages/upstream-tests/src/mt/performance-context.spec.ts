/**
 * Unit tests for the shared performance pipeline context.
 *
 * These test the BG-side context lifecycle: beginPipeline, captureTimingFlag,
 * markTiming, takePipelineOptions, resetPipelineContext — independent of
 * the full MT pipeline.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  beginPipeline,
  captureTimingFlag,
  getCurrentPipelineID,
  hasTimingFlag,
  markTiming,
  resetPipelineContext,
  takePipelineOptions,
  TIMING_FLAG_PROP,
} from '../../../vue-lynx/runtime/src/performance.js';

// Stub lynx.performance for testing
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

  // Install stub
  (globalThis as any).lynx = { performance: perfStub };
});

afterEach(() => {
  resetPipelineContext();
  delete (globalThis as any).lynx;
});

describe('performance pipeline context', () => {
  describe('beginPipeline', () => {
    it('generates pipeline options and calls onPipelineStart', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-001',
        needTimestamps: false,
      });

      beginPipeline('update');

      expect(perfStub._generatePipelineOptions).toHaveBeenCalledTimes(1);
      expect(perfStub._onPipelineStart).toHaveBeenCalledWith(
        'pl-001',
        expect.objectContaining({ pipelineID: 'pl-001' }),
      );
      expect(getCurrentPipelineID()).toBe('pl-001');
    });

    it('sets metadata BEFORE calling _onPipelineStart', () => {
      let optsSnapshot: Record<string, unknown> | undefined;
      perfStub._onPipelineStart.mockImplementation(
        (_id: string, opts: Record<string, unknown>) => {
          optsSnapshot = { ...opts };
        },
      );
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-meta',
        needTimestamps: false,
      });

      beginPipeline('setup');

      expect(optsSnapshot).toMatchObject({
        pipelineOrigin: 'vue',
        dsl: 'vue',
        stage: 'setup',
      });
    });

    it('is idempotent within a single batch', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-002',
        needTimestamps: false,
      });

      beginPipeline('update');
      beginPipeline('update');

      expect(perfStub._generatePipelineOptions).toHaveBeenCalledTimes(1);
    });

    it('no-ops when API is unavailable', () => {
      (globalThis as any).lynx = {};
      beginPipeline('update');
      expect(getCurrentPipelineID()).toBeUndefined();
    });

    it('no-ops when lynx is undefined', () => {
      delete (globalThis as any).lynx;
      beginPipeline('update');
      expect(getCurrentPipelineID()).toBeUndefined();
    });

    it('stamps pipelineOrigin, dsl, and stage on options', () => {
      const opts = { pipelineID: 'pl-003', needTimestamps: false };
      perfStub._generatePipelineOptions.mockReturnValue(opts);

      beginPipeline('setup');

      expect(opts).toMatchObject({
        pipelineOrigin: 'vue',
        dsl: 'vue',
        stage: 'setup',
      });
    });
  });

  describe('captureTimingFlag', () => {
    beforeEach(() => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-flag',
        needTimestamps: false,
      });
      beginPipeline('update');
    });

    it('binds the first non-empty flag to the pipeline', () => {
      captureTimingFlag('my-benchmark');

      expect(hasTimingFlag()).toBe(true);
      expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledWith(
        'pl-flag',
        'my-benchmark',
      );
    });

    it('retroactively binds flag captured BEFORE beginPipeline', () => {
      resetPipelineContext();
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-retro',
        needTimestamps: false,
      });

      // Flag captured before pipeline (simulates patchProp before scheduleFlush)
      captureTimingFlag('early-flag');
      expect(perfStub._bindPipelineIdWithTimingFlag).not.toHaveBeenCalled();

      // Pipeline starts later (scheduleFlush)
      beginPipeline('update');

      // Flag is retroactively bound
      expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledWith(
        'pl-retro',
        'early-flag',
      );
      expect(hasTimingFlag()).toBe(true);
      const opts = takePipelineOptions();
      expect(opts!['needTimestamps']).toBe(true);
    });

    it('enables needTimestamps when flag is captured', () => {
      captureTimingFlag('flag-1');
      const opts = takePipelineOptions();
      expect(opts).toMatchObject({ needTimestamps: true });
    });

    it('ignores null, undefined, and empty string', () => {
      captureTimingFlag(null);
      captureTimingFlag(undefined);
      captureTimingFlag('');

      expect(hasTimingFlag()).toBe(false);
      expect(perfStub._bindPipelineIdWithTimingFlag).not.toHaveBeenCalled();
    });

    it('same flag is idempotent (no double bind)', () => {
      captureTimingFlag('dup');
      captureTimingFlag('dup');

      expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledTimes(1);
    });

    it('first flag wins, conflicting flag is ignored with dev warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      captureTimingFlag('first');
      captureTimingFlag('second');

      expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledTimes(1);
      expect(perfStub._bindPipelineIdWithTimingFlag).toHaveBeenCalledWith(
        'pl-flag',
        'first',
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]![0]).toContain('Multiple different');

      warnSpy.mockRestore();
    });

    it('deduplicates the dev warning for subsequent conflicts', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      captureTimingFlag('first');
      captureTimingFlag('second');
      captureTimingFlag('third');

      // Only one warning regardless of how many conflicts
      expect(warnSpy).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });
  });

  describe('takePipelineOptions', () => {
    it('returns undefined when no pipeline is active', () => {
      expect(takePipelineOptions()).toBeUndefined();
    });

    it('returns options when pipeline active even without flag (completes native pipeline)', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-noflag',
        needTimestamps: false,
      });
      beginPipeline('update');
      const opts = takePipelineOptions();
      expect(opts).toBeTruthy();
      expect(opts!['pipelineID']).toBe('pl-noflag');
      expect(opts!['needTimestamps']).toBe(false);
    });

    it('returns options when pipeline + flag are present', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-take',
        needTimestamps: false,
      });
      beginPipeline('update');
      captureTimingFlag('bench');

      const opts = takePipelineOptions();
      expect(opts).toBeTruthy();
      expect(opts!['pipelineID']).toBe('pl-take');
      expect(opts!['needTimestamps']).toBe(true);
    });
  });

  describe('markTiming', () => {
    it('calls _markTiming on the performance API', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-mark',
        needTimestamps: false,
      });
      beginPipeline('update');
      markTiming('vueRenderStart');

      expect(perfStub._markTiming).toHaveBeenCalledWith('pl-mark', 'vueRenderStart');
    });

    it('no-ops when no pipeline is active', () => {
      markTiming('vueRenderStart');
      expect(perfStub._markTiming).not.toHaveBeenCalled();
    });
  });

  describe('resetPipelineContext', () => {
    it('clears all state', () => {
      perfStub._generatePipelineOptions.mockReturnValue({
        pipelineID: 'pl-reset',
        needTimestamps: false,
      });
      beginPipeline('update');
      captureTimingFlag('flag');

      resetPipelineContext();

      expect(getCurrentPipelineID()).toBeUndefined();
      expect(hasTimingFlag()).toBe(false);
      expect(takePipelineOptions()).toBeUndefined();
    });

    it('allows a new pipeline to be created after reset', () => {
      perfStub._generatePipelineOptions
        .mockReturnValueOnce({ pipelineID: 'pl-a', needTimestamps: false })
        .mockReturnValueOnce({ pipelineID: 'pl-b', needTimestamps: false });

      beginPipeline('update');
      resetPipelineContext();
      beginPipeline('update');

      expect(getCurrentPipelineID()).toBe('pl-b');
    });
  });

  describe('TIMING_FLAG_PROP constant', () => {
    it('equals __lynx_timing_flag', () => {
      expect(TIMING_FLAG_PROP).toBe('__lynx_timing_flag');
    });
  });
});
