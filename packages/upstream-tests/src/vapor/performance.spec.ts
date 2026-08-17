/**
 * Lynx Performance API integration under the Vapor runtime.
 *
 * The pipeline plumbing is shared with the virtual-DOM renderer (see
 * `../performance.spec.ts`) because it hooks the ops pipeline, not the
 * renderer. What this file pins down is that Vapor — which has no virtual DOM,
 * writes to the ops buffer straight from reactive effects, and sets attributes
 * through `ShadowElement.setAttribute` rather than a `patchProp` — reaches the
 * same pipeline through that shared seam, and identifies itself distinctly.
 */

import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { nextTick, ref, resetForTesting } from 'vue-lynx';
import {
  DSL_VUE_VAPOR,
  TIMING_FLAG_ATTR,
} from 'vue-lynx/internal/ops';
import {
  child,
  createVaporApp,
  defineVaporComponent,
  renderEffect,
  setText,
  template,
} from 'vue-lynx/vapor';

import { resetPerformanceState } from '../../../vue-lynx/runtime/src/performance.js';
import { resetCapturedOps } from '../local-test-setup.js';

interface PipelineOptionsLike {
  pipelineID: string;
  pipelineOrigin?: string;
  needTimestamps?: boolean;
  dsl?: string;
  stage?: string;
}

const g = globalThis as Record<string, unknown>;

let nextPipelineId = 1;
let started: PipelineOptionsLike[] = [];
let marks: Array<[string, string]> = [];
let sentPayloads: Array<{ data: string; pipelineOptions?: PipelineOptionsLike }> =
  [];

const originalLynx = g['lynx'];

beforeEach(() => {
  nextPipelineId = 1;
  started = [];
  marks = [];
  sentPayloads = [];

  g['lynx'] = {
    performance: {
      _generatePipelineOptions(): PipelineOptionsLike {
        return { pipelineID: `p${nextPipelineId++}` };
      },
      _onPipelineStart(
        pipelineID: string,
        options?: PipelineOptionsLike,
      ): void {
        started.push(options ?? { pipelineID });
      },
      _markTiming(pipelineID: string, key: string): void {
        marks.push([pipelineID, key]);
      },
    },
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
  g['SystemInfo'] = { lynxSdkVersion: '4.0.1' };

  resetForTesting();
  resetPerformanceState();
  resetCapturedOps();
});

afterEach(() => {
  g['lynx'] = originalLynx;
  delete g['SystemInfo'];
});

describe('Vapor pipeline integration', () => {
  it('reports Vapor separately from the virtual-DOM renderer', async () => {
    const count = ref(0);
    const Counter = defineVaporComponent({
      setup() {
        const t = template('<text> </text>')();
        const text = child(t as never);
        renderEffect(() => setText(text as never, String(count.value)));
        return t;
      },
    });
    createVaporApp(Counter).mount();
    await nextTick();

    // The first batch is the first screen and belongs to the engine's load
    // pipeline, exactly as under the vdom renderer.
    expect(sentPayloads).toHaveLength(1);
    expect(sentPayloads[0]!.pipelineOptions).toBeUndefined();

    count.value++;
    await nextTick();

    expect(started).toHaveLength(1);
    expect(started[0]!.dsl).toBe(DSL_VUE_VAPOR);
    expect(started[0]!.stage).toBe('update');
    expect(sentPayloads[1]!.pipelineOptions?.pipelineID).toBe(
      started[0]!.pipelineID,
    );
  });

  it('picks up a Timing Flag written through setAttribute', async () => {
    const flag = ref('');
    const Flagged = defineVaporComponent({
      setup() {
        const t = template('<view></view>')();
        renderEffect(() => {
          (t as unknown as { setAttribute(k: string, v: string): void })
            .setAttribute(TIMING_FLAG_ATTR, flag.value);
        });
        return t;
      },
    });
    createVaporApp(Flagged).mount();
    await nextTick();

    flag.value = 'feed-ready';
    await nextTick();

    expect(sentPayloads[1]!.pipelineOptions?.needTimestamps).toBe(true);
    expect(marks.map(m => m[1])).toEqual([
      'diffVdomStart',
      'diffVdomEnd',
      'packChangesStart',
      'packChangesEnd',
    ]);
  });
});
