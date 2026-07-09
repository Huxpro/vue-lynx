// Lynx port of vuejs/core packages-private/benchmark/client/profiling.ts.
//
// Where the upstream wrap() measures `performance.now()` around
// `fn() + await nextTick()` on the browser main thread, the Lynx version
// splits the dual-thread pipeline into two timestamps per operation:
//
//   bg  — fn() → runtime-core nextTick: reactivity + render/patch (vdom) or
//         renderEffects (vapor) + ShadowElement mutations + ops
//         serialization + callLepusMethod post. Pure Background Thread cost.
//   e2e — fn() → vue-lynx nextTick (vuePatchUpdate acknowledgement): bg +
//         cross-thread transfer + Main Thread applyOps (real DOM application
//         on the web platform).
//
// It additionally records the ops-stream shape per operation (flush batches,
// op count, serialized bytes) via vue-lynx's flush observability hook
// (globalThis.__VUE_LYNX_FLUSH_HOOK__).

import { nextTick as bgNextTick } from '@vue/runtime-core';
import { nextTick as e2eNextTick } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';

// ---------------------------------------------------------------------------
// time
// ---------------------------------------------------------------------------

const now: () => number = typeof performance !== 'undefined' && performance.now
  ? () => performance.now()
  : () => Date.now();

// ---------------------------------------------------------------------------
// ops-stream instrumentation
// ---------------------------------------------------------------------------

const OP_ARITY: Record<number, number> = {
  [OP.CREATE]: 2,
  [OP.CREATE_TEXT]: 1,
  [OP.INSERT]: 3,
  [OP.REMOVE]: 2,
  [OP.SET_PROP]: 3,
  [OP.SET_TEXT]: 2,
  [OP.SET_EVENT]: 4,
  [OP.REMOVE_EVENT]: 3,
  [OP.SET_STYLE]: 2,
  [OP.SET_CLASS]: 2,
  [OP.SET_ID]: 2,
  [OP.SET_WORKLET_EVENT]: 4,
  [OP.SET_MT_REF]: 2,
  [OP.INIT_MT_REF]: 2,
  [OP.SET_SCOPE_ID]: 2,
};

function countOps(flat: unknown[]): number {
  let count = 0;
  let i = 0;
  while (i < flat.length) {
    const arity = OP_ARITY[flat[i] as number];
    if (arity === undefined) break; // unknown op — stop counting, keep bytes
    count++;
    i += 1 + arity;
  }
  return count;
}

interface OpsWindow {
  flushes: number;
  ops: number;
  bytes: number;
}

const currentWindow: OpsWindow = { flushes: 0, ops: 0, bytes: 0 };

function resetWindow(): void {
  currentWindow.flushes = 0;
  currentWindow.ops = 0;
  currentWindow.bytes = 0;
}

/**
 * Observe every vuePatchUpdate flush through vue-lynx's flush hook
 * (`globalThis.__VUE_LYNX_FLUSH_HOOK__`). Must run before the app first
 * flushes (call at entry top, before mount).
 */
export function setupBenchInstrumentation(): void {
  (globalThis as {
    __VUE_LYNX_FLUSH_HOOK__?: (ops: unknown[], serialized: string) => void;
  }).__VUE_LYNX_FLUSH_HOOK__ = (ops, serialized) => {
    currentWindow.flushes++;
    currentWindow.bytes += serialized.length;
    currentWindow.ops += countOps(ops);
  };
}

// ---------------------------------------------------------------------------
// measurement
// ---------------------------------------------------------------------------

export interface Sample {
  op: string;
  /** BG-thread duration (ms). */
  bg: number;
  /** End-to-end duration incl. MT applyOps ack (ms). */
  e2e: number;
  flushes: number;
  ops: number;
  bytes: number;
}

const samples: Sample[] = [];

function report(line: string): void {
  // Harness picks these up from the page console (worker logs propagate).
  console.log(line);
}

/** Let the pipeline fully settle between measurements. */
export async function settle(ms = 32): Promise<void> {
  await e2eNextTick();
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function measure(op: string, fn: () => void): Promise<Sample> {
  resetWindow();
  const start = now();
  fn();
  await bgNextTick();
  const bg = now() - start;
  await e2eNextTick();
  const e2e = now() - start;
  const sample: Sample = {
    op,
    bg,
    e2e,
    flushes: currentWindow.flushes,
    ops: currentWindow.ops,
    bytes: currentWindow.bytes,
  };
  samples.push(sample);
  report(`__BENCH__${JSON.stringify(sample)}`);
  return sample;
}

export function memMarker(phase: string): void {
  report(`__BENCH_MEM__${phase}`);
}

// ---------------------------------------------------------------------------
// scenario — krausest-style operation suite
// ---------------------------------------------------------------------------

export interface BenchApi {
  run(): void; // create 1,000 rows (replaces table)
  runLots(): void; // create 10,000 rows (replaces table)
  add(): void; // append 1,000 rows
  update(): void; // update every 10th row label
  select(id: number): void;
  remove(id: number): void;
  swapRows(): void;
  clear(): void;
  rowIds(): number[];
  setStatus(text: string): void;
}

export interface ScenarioOptions {
  /** Samples per interaction op. */
  count?: number;
  /** Samples for the heavy 10k ops. */
  heavyCount?: number;
  /** Warmup iterations (unmeasured). */
  warmup?: number;
}

export interface BenchResult {
  mode: string;
  samples: Sample[];
}

export async function runScenario(
  mode: string,
  api: BenchApi,
  options: ScenarioOptions = {},
): Promise<BenchResult> {
  const count = options.count ?? 10;
  const heavyCount = options.heavyCount ?? 5;
  const warmup = options.warmup ?? 5;

  const phase = async (text: string): Promise<void> => {
    api.setStatus(text);
    await settle();
  };

  memMarker('mounted');
  await settle(100);

  // -- warmup (unmeasured) --------------------------------------------------
  await phase('warmup');
  for (let i = 0; i < warmup; i++) {
    api.run();
    await settle();
    api.clear();
    await settle();
  }

  // -- create1k: clear (unmeasured) → run (measured) ------------------------
  await phase('create1k');
  for (let i = 0; i < count; i++) {
    api.clear();
    await settle();
    await measure('create1k', () => api.run());
    await settle();
  }

  // -- update10th: on a fresh 1k table --------------------------------------
  await phase('update10th');
  api.clear();
  await settle();
  api.run();
  await settle();
  for (let i = 0; i < count; i++) {
    await measure('update10th', () => api.update());
    await settle();
  }

  // -- select: on the same 1k table ------------------------------------------
  await phase('select');
  {
    const ids = api.rowIds();
    for (let i = 0; i < count; i++) {
      const id = ids[(i * 97) % ids.length]!;
      await measure('select', () => api.select(id));
      await settle();
    }
  }

  // -- swap rows --------------------------------------------------------------
  await phase('swap');
  for (let i = 0; i < count; i++) {
    await measure('swap', () => api.swapRows());
    await settle();
  }

  // -- remove: remove a mid-table row ----------------------------------------
  await phase('remove');
  for (let i = 0; i < count; i++) {
    const ids = api.rowIds();
    const id = ids[Math.floor(ids.length / 2)]!;
    await measure('remove', () => api.remove(id));
    await settle();
  }

  // -- append1k: reset to 1k (unmeasured) → add (measured) -------------------
  await phase('append1k');
  for (let i = 0; i < count; i++) {
    api.clear();
    await settle();
    api.run();
    await settle();
    await measure('append1k', () => api.add());
    await settle();
  }

  // -- create10k / clear10k ----------------------------------------------------
  await phase('create10k');
  for (let i = 0; i < heavyCount; i++) {
    api.clear();
    await settle();
    await measure('create10k', () => api.runLots());
    await settle(100);
    memMarker(i === heavyCount - 1 ? 'after10k' : `10k-${i}`);
    await measure('clear10k', () => api.clear());
    await settle(100);
  }
  memMarker('afterClear');

  await phase('done');
  const result: BenchResult = { mode, samples };
  report(`__BENCH_DONE__${JSON.stringify(result)}`);
  return result;
}
