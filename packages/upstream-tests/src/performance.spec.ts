/**
 * Lynx Performance API integration — background and main thread.
 *
 * The contract under test is the one the engine relies on: a pipeline context
 * is created once, carried with the changes it describes across the thread
 * boundary, attached to the flush that submits those changes, and never
 * attached to anything else.
 */

import { createApp, h, nextTick, ref, resetForTesting } from 'vue-lynx';
import { PIPELINE_ORIGIN_UPDATE_BTS, TIMING_FLAG_ATTR } from 'vue-lynx/internal/ops';

import {
  beginUpdatePipeline,
  markTiming,
  notePipelineBatchDispatched,
  observeTimingFlagProp,
  resetPerformanceState,
  takePipeline,
} from '../../vue-lynx/runtime/src/performance.js';
import {
  flushElementTree,
  resetPerformanceState as resetMtPerformanceState,
  setPageElement,
  setPendingLoadPipeline,
  setPipeline,
} from '../../vue-lynx/main-thread/src/performance.js';

interface PipelineOptionsLike {
  pipelineID: string;
  pipelineOrigin?: string;
  needTimestamps?: boolean;
  dsl?: string;
  stage?: string;
}

// ---------------------------------------------------------------------------
// Engine stubs
// ---------------------------------------------------------------------------

const g = globalThis as Record<string, unknown>;

let nextPipelineId = 1;
let started: PipelineOptionsLike[] = [];
let marks: Array<[string, string]> = [];
let boundFlags: Array<[string, string]> = [];
let flushes: Array<{ root: unknown; options: unknown }> = [];
let sentPayloads: Array<{ data: string; pipelineOptions?: PipelineOptionsLike }> =
  [];

const performanceStub = {
  _generatePipelineOptions(): PipelineOptionsLike {
    return { pipelineID: `p${nextPipelineId++}` };
  },
  _onPipelineStart(pipelineID: string, options?: PipelineOptionsLike): void {
    started.push(options ?? { pipelineID });
  },
  _markTiming(pipelineID: string, key: string): void {
    marks.push([pipelineID, key]);
  },
  _bindPipelineIdWithTimingFlag(pipelineID: string, flag: string): void {
    boundFlags.push([pipelineID, flag]);
  },
};

const originalLynx = g['lynx'];

beforeEach(() => {
  nextPipelineId = 1;
  started = [];
  marks = [];
  boundFlags = [];
  flushes = [];
  sentPayloads = [];

  // The shared local-test-setup stub captures ops but has no Performance API
  // and drops the rest of the payload; wrap it so both are observable.
  g['lynx'] = {
    performance: performanceStub,
    getNativeApp() {
      return {
        callLepusMethod(
          _method: string,
          params: { data: string; pipelineOptions?: PipelineOptionsLike },
          callback: () => void,
        ) {
          sentPayloads.push(params);
          callback();
        },
      };
    },
  };
  // Version gate for the two-argument `_onPipelineStart`.
  g['SystemInfo'] = { lynxSdkVersion: '4.0.1' };
  g['__FlushElementTree'] = (root?: unknown, options?: unknown) => {
    flushes.push({ root, options });
  };

  resetForTesting();
  resetPerformanceState();
  resetMtPerformanceState();
});

afterEach(() => {
  g['lynx'] = originalLynx;
  delete g['SystemInfo'];
  delete g['__FlushElementTree'];
});

// ---------------------------------------------------------------------------
// Background thread
// ---------------------------------------------------------------------------

describe('background thread pipeline lifecycle', () => {
  it('leaves the first batch to the engine load pipeline', async () => {
    const count = ref(0);
    createApp({
      render: () => h('view', null, [h('text', null, String(count.value))]),
    }).mount();
    await nextTick();

    expect(sentPayloads).toHaveLength(1);
    expect(sentPayloads[0]!.pipelineOptions).toBeUndefined();
    expect(started).toHaveLength(0);
  });

  it('opens exactly one framework pipeline per update batch', async () => {
    const count = ref(0);
    createApp({
      render: () => h('text', null, String(count.value)),
    }).mount();
    await nextTick();

    count.value++;
    await nextTick();

    expect(started).toHaveLength(1);
    expect(started[0]!.pipelineOrigin).toBe(PIPELINE_ORIGIN_UPDATE_BTS);
    expect(started[0]!.dsl).toBe('vue');
    expect(started[0]!.stage).toBe('update');
    expect(started[0]!.needTimestamps).toBe(false);

    const sent = sentPayloads[1]!;
    expect(sent.pipelineOptions?.pipelineID).toBe(started[0]!.pipelineID);
  });

  it('carries a distinct pipeline on each subsequent update', async () => {
    const count = ref(0);
    createApp({ render: () => h('text', null, String(count.value)) }).mount();
    await nextTick();

    count.value++;
    await nextTick();
    count.value++;
    await nextTick();

    const ids = sentPayloads
      .map(p => p.pipelineOptions?.pipelineID)
      .filter(Boolean);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('marks the framework rendering window only when timestamps are wanted', async () => {
    const count = ref(0);
    createApp({ render: () => h('text', null, String(count.value)) }).mount();
    await nextTick();

    count.value++;
    await nextTick();

    // `diffVdomStart` is forced so a pipeline that turns out to be flagged
    // still reports a start; the rest stay off for an unflagged update.
    expect(marks.map(m => m[1])).toEqual(['diffVdomStart']);
  });

  it('reports the full framework window once a Timing Flag is present', async () => {
    const flag = ref('');
    createApp({
      render: () =>
        h('view', flag.value ? { [TIMING_FLAG_ATTR]: flag.value } : null),
    }).mount();
    await nextTick();

    flag.value = 'feed-ready';
    await nextTick();

    const keys = marks.map(m => m[1]);
    expect(keys).toEqual([
      'diffVdomStart',
      'diffVdomEnd',
      'packChangesStart',
      'packChangesEnd',
    ]);
    // The engine reads the flag off the element itself — binding it here as
    // well would attribute the same flag twice.
    expect(boundFlags).toHaveLength(0);
    expect(sentPayloads[1]!.pipelineOptions?.needTimestamps).toBe(true);
  });

  it('drops a pipeline whose tick produced no element changes', () => {
    notePipelineBatchDispatched();
    beginUpdatePipeline();
    expect(started).toHaveLength(1);

    // A tick that mutates nothing observable still schedules a flush; the
    // context it opened must not survive into the next update.
    expect(takePipeline()?.pipelineID).toBe('p1');
    expect(takePipeline()).toBeUndefined();
  });

  it('ignores marks and flags when no pipeline is open', () => {
    markTiming('diffVdomEnd', true);
    observeTimingFlagProp(TIMING_FLAG_ATTR, 'x');
    expect(marks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Main thread
// ---------------------------------------------------------------------------

describe('main thread pipeline association', () => {
  const page = { page: true } as unknown as Parameters<
    typeof setPageElement
  >[0];

  beforeEach(() => {
    setPageElement(page);
  });

  it('preserves the original call shape when nothing is associated', () => {
    flushElementTree();
    flushElementTree(page);
    expect(flushes).toEqual([
      { root: undefined, options: undefined },
      { root: page, options: undefined },
    ]);
  });

  it('attaches a retained load pipeline to the first real-content flush', () => {
    const load = { pipelineID: 'load-1', pipelineOrigin: 'loadBundle' };
    setPendingLoadPipeline(load);

    flushElementTree();
    expect(flushes[0]!.options).toEqual({ pipelineOptions: load });

    // Committed once: a later flush must not resubmit it.
    flushElementTree();
    expect(flushes[1]!.options).toBeUndefined();
  });

  it('lets the load pipeline win over an update pipeline on the same flush', () => {
    const load = { pipelineID: 'load-1' };
    setPendingLoadPipeline(load);
    setPipeline({ pipelineID: 'update-1' });

    flushElementTree();
    expect(flushes[0]!.options).toEqual({ pipelineOptions: load });

    flushElementTree();
    expect(flushes[1]!.options).toBeUndefined();
  });

  it('merges the pipeline into caller-owned flush options', () => {
    setPipeline({ pipelineID: 'u1' });
    flushElementTree(page, { triggerLayout: false });
    expect(flushes[0]).toEqual({
      root: page,
      options: { triggerLayout: false, pipelineOptions: { pipelineID: 'u1' } },
    });
  });

  it('never overwrites a caller-owned option with the pipeline', () => {
    setPipeline({ pipelineID: 'u1' });
    flushElementTree(page, { triggerLayout: true, listID: 7 });
    const options = flushes[0]!.options as Record<string, unknown>;
    expect(options['triggerLayout']).toBe(true);
    expect(options['listID']).toBe(7);
  });
});
