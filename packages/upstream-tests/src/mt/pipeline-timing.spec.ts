/**
 * Pipeline timing flag contract tests.
 *
 * Verifies the end-to-end flow: BG captures __lynx_timing_flag during
 * patch → doFlush includes pipelineOptions in the vuePatchUpdate payload →
 * MT applyOps passes pipelineOptions to __FlushElementTree.
 *
 * These tests run against the real BG→MT→PAPI pipeline (vitest.dom.config.ts).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
import { applyOps, elements } from '../../../vue-lynx/main-thread/src/ops-apply.js';

let nextId = 500000;

let ROOT = 0;
beforeEach(() => {
  ROOT = nextId++;
  applyOps([OP.CREATE, ROOT, 'view']);
});

describe('pipeline timing flag → __FlushElementTree pipelineOptions', () => {
  it('passes pipelineOptions to __FlushElementTree when provided', () => {
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    const childId = nextId++;
    const pipelineOptions = {
      pipelineID: 'test-pipeline-123',
      needTimestamps: true,
      pipelineOrigin: 'vue',
      dsl: 'vue',
      stage: 'update',
    };

    // Simulate what vuePatchUpdate does when BG sends pipelineOptions
    applyOps(
      [OP.CREATE, childId, 'text', OP.INSERT, ROOT, childId, -1],
      true,
      pipelineOptions,
    );

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledWith(undefined, { pipelineOptions });

    (globalThis as any).__FlushElementTree = origFlush;
  });

  it('calls bare __FlushElementTree when no pipelineOptions', () => {
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    const childId = nextId++;
    applyOps(
      [OP.CREATE, childId, 'text', OP.INSERT, ROOT, childId, -1],
      true,
      undefined,
    );

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledWith();

    (globalThis as any).__FlushElementTree = origFlush;
  });

  it('propagates pipelineOptions through vuePatchUpdate handler', () => {
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    const childId = nextId++;
    const pipelineOptions = {
      pipelineID: 'test-pipeline-456',
      needTimestamps: true,
    };

    // Call vuePatchUpdate directly as the MT handler receives it
    const vuePatchUpdate = (globalThis as any)['vuePatchUpdate'] as (
      payload: { data: string; pipelineOptions?: Record<string, unknown> },
    ) => void;

    vuePatchUpdate({
      data: JSON.stringify([OP.CREATE, childId, 'view', OP.INSERT, ROOT, childId, -1]),
      pipelineOptions,
    });

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledWith(undefined, { pipelineOptions });

    (globalThis as any).__FlushElementTree = origFlush;
  });

  it('vuePatchUpdate without pipelineOptions calls bare __FlushElementTree', () => {
    const flushSpy = vi.fn();
    const origFlush = (globalThis as any).__FlushElementTree;
    (globalThis as any).__FlushElementTree = flushSpy;

    const childId = nextId++;
    const vuePatchUpdate = (globalThis as any)['vuePatchUpdate'] as (
      payload: { data: string },
    ) => void;

    vuePatchUpdate({
      data: JSON.stringify([OP.CREATE, childId, 'view', OP.INSERT, ROOT, childId, -1]),
    });

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledWith();

    (globalThis as any).__FlushElementTree = origFlush;
  });
});
