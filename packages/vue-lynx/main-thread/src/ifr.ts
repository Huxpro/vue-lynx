// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * IFR (Instant First-Frame Rendering) — main-thread first-screen render and
 * background-thread hydration.
 *
 * When the vue-lynx plugin builds with `enableIFR: true`, the main-thread
 * bundle contains the full Vue runtime + user app (not just worklet
 * registrations).  The flow mirrors ReactLynx's IFR:
 *
 *   1. `renderPage` (called synchronously during loadTemplate, before any
 *      background JS runs) mounts the Vue app *on the main thread*.  The ops
 *      the renderer produces are applied locally via {@link applyOps} — the
 *      first frame is on screen without a cross-thread round-trip.  Every
 *      applied batch is also recorded.
 *   2. The background thread boots and renders the same app with the same
 *      data.  Because both threads run identical, deterministic code, the
 *      ShadowElement ids and event signs it generates line up with the
 *      main-thread render.
 *   3. Hydration: the background thread's initial `vuePatchUpdate` batches
 *      are compared against the recorded ops stream —
 *        - identical batch        → skipped (already applied during IFR)
 *        - value-level mismatch   → the background value is patched in place
 *        - structural mismatch    → the IFR tree is torn down and the
 *                                   background batch applied from scratch
 *      Either way the background thread ends up owning the tree, and all
 *      subsequent updates flow through the normal ops pipeline.
 *
 * Events bound during the IFR render use the same sign strings the
 * background thread will register (`vue:N`), so taps that happen after the
 * background thread boots are routed correctly with no re-binding.  Worklet
 * event contexts are always re-applied from the background batch because the
 * BG side stamps `_execId` (required for `runOnBackground`).
 */

import { OP } from 'vue-lynx/internal/ops';

import { elements } from './element-registry.js';
import { applyOps } from './ops-apply.js';

/** Must match PAGE_ROOT_ID in runtime/src/shadow-element.ts. */
const PAGE_ROOT_ID = 1;

type Phase = 'inactive' | 'enabled' | 'rendered' | 'hydrated';

let phase: Phase = 'inactive';
let recordedBatches: unknown[][] = [];
let batchCursor = 0;

// ---------------------------------------------------------------------------
// Op-frame walking
// ---------------------------------------------------------------------------

/** Number of arguments following each opcode in the flat ops array. */
const OP_ARITY: Record<number, number> = {
  [OP.CREATE]: 2, // id, type
  [OP.CREATE_TEXT]: 1, // id
  [OP.INSERT]: 3, // parentId, childId, anchorId
  [OP.REMOVE]: 2, // parentId, childId
  [OP.SET_PROP]: 3, // id, key, value
  [OP.SET_TEXT]: 2, // id, text
  [OP.SET_EVENT]: 4, // id, eventType, eventName, sign
  [OP.REMOVE_EVENT]: 3, // id, eventType, eventName
  [OP.SET_STYLE]: 2, // id, styleObject
  [OP.SET_CLASS]: 2, // id, classString
  [OP.SET_ID]: 2, // id, idString
  [OP.SET_WORKLET_EVENT]: 4, // id, eventType, eventName, workletCtx
  [OP.SET_MT_REF]: 2, // id, refImpl
  [OP.INIT_MT_REF]: 2, // wvid, initValue
  [OP.SET_SCOPE_ID]: 2, // id, cssId
};

/**
 * How a mismatch in the *last* argument of an op is handled during
 * hydration.  Ops not listed here are structural: any difference aborts
 * reconciliation.
 *
 * - 'patch':  apply the background frame when the value differs
 * - 'always': apply the background frame unconditionally (worklet ctx needs
 *             the BG-stamped `_execId`; MT-ref application is idempotent)
 */
const VALUE_OP: Record<number, 'patch' | 'always'> = {
  [OP.SET_PROP]: 'patch',
  [OP.SET_TEXT]: 'patch',
  [OP.SET_EVENT]: 'patch',
  [OP.SET_STYLE]: 'patch',
  [OP.SET_CLASS]: 'patch',
  [OP.SET_ID]: 'patch',
  [OP.SET_SCOPE_ID]: 'patch',
  [OP.SET_WORKLET_EVENT]: 'always',
  [OP.SET_MT_REF]: 'always',
  [OP.INIT_MT_REF]: 'always',
};

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  // Ops are JSON-serializable by construction (they cross the thread
  // boundary as JSON), so stringify comparison is a faithful deep-equal.
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Public API — wired into entry-main.ts
// ---------------------------------------------------------------------------

/**
 * Activate IFR on this thread.  Called by the `entry-ifr` bootstrap, which
 * the plugin injects into the main-thread bundle *before* user code, so the
 * flags are visible when `createApp().mount()` evaluates.
 */
export function enableIFR(): void {
  const g = globalThis as Record<string, unknown>;
  g['__VUE_LYNX_IFR_MT__'] = true;
  g['__vueLynxIfrApplyOps'] = recordAndApply;
  phase = 'enabled';
}

let warnedPostHydrationOps = false;

function recordAndApply(ops: unknown[]): void {
  // After hydration the background thread owns the tree (matching
  // ReactLynx, where the main thread stops responding to updates once it
  // hands over control). Ops produced by the main-thread Vue app past that
  // point — e.g. a timer-driven effect, or buffered leftovers from a failed
  // render — would desync the tree from the background thread's view, so
  // they are dropped.
  if (phase === 'hydrated') {
    if (__DEV__ && !warnedPostHydrationOps) {
      warnedPostHydrationOps = true;
      console.warn(
        '[vue-lynx] IFR: dropping main-thread render ops produced after '
          + 'hydration. First-screen code must not keep updating on the '
          + 'main thread (side effects belong in onMounted / watchers, '
          + 'which only run on the background thread).',
      );
    }
    return;
  }
  recordedBatches.push(ops);
  applyOps(ops);
}

/**
 * Run the deferred main-thread mount(s).  Called from `renderPage` right
 * after the page root element is created.  No-op unless {@link enableIFR}
 * ran and user code registered an app on this thread.
 */
export function runIfrRender(_data: unknown): void {
  if (phase === 'inactive') return;

  // renderPage may fire again in the same context (test envs, reload paths);
  // start every render from a clean slate.
  recordedBatches = [];
  batchCursor = 0;
  phase = 'enabled';

  const trigger = (globalThis as Record<string, unknown>)[
    '__vueLynxIfrMountApps'
  ] as (() => void) | undefined;
  if (!trigger) return;

  try {
    // Mounting is fully synchronous: Vue renders, the runtime's flush hook
    // hands each ops batch to recordAndApply, and the elements are created
    // through PAPI before this call returns.
    trigger();
    phase = 'rendered';
  } catch (err) {
    // A failed first-screen render must not take down renderPage — tear down
    // whatever was partially applied and let the background thread render
    // normally (no IFR benefit, full correctness).
    console.error(
      '[vue-lynx] IFR first-screen render failed; falling back to background render.',
      err,
    );
    teardownIfrTree();
    phase = 'hydrated';
  }
}

/**
 * Hydration entry point.  Called from `vuePatchUpdate` with the raw JSON
 * string before it is parsed/applied.  Returns `true` when the batch was
 * consumed by hydration (already applied during IFR, possibly with value
 * patches); `false` when the caller should apply it normally.
 */
export function interceptPatchUpdate(data: string): boolean {
  if (phase !== 'rendered') return false;

  if (batchCursor >= recordedBatches.length) {
    phase = 'hydrated';
    return false;
  }

  const recorded = recordedBatches[batchCursor]!;

  // Fast path: both threads ran identical deterministic code, so the JSON
  // payload the background thread produced is byte-for-byte the batch we
  // recorded.  Nothing to do — it is already on screen.
  if (JSON.stringify(recorded) === data) {
    advanceCursor();
    return true;
  }

  const incoming = JSON.parse(data) as unknown[];
  const patchOps = reconcileBatch(recorded, incoming);
  if (patchOps) {
    if (patchOps.length > 0) applyOps(patchOps);
    advanceCursor();
    return true;
  }

  // Structural mismatch — the renders diverged (non-deterministic render or
  // thread-dependent branching).  Remove the IFR tree and let the caller
  // apply the background batch onto a clean page.
  if (__DEV__) {
    console.warn(
      '[vue-lynx] IFR hydration mismatch: the background render differs '
        + 'structurally from the main-thread first-screen render. Falling '
        + 'back to a full re-render. First-screen code should be '
        + 'deterministic and thread-agnostic.',
    );
  }
  teardownIfrTree();
  phase = 'hydrated';
  return false;
}

function advanceCursor(): void {
  batchCursor++;
  if (batchCursor >= recordedBatches.length) phase = 'hydrated';
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

/**
 * Walk the recorded and incoming ops streams frame-by-frame.
 *
 * Returns the (possibly empty) list of incoming frames that must be applied
 * to bring the IFR tree in line with the background render, or `null` on a
 * structural mismatch.
 *
 * If the incoming stream is longer than the recorded one (e.g. the
 * background thread merged a follow-up update into its first flush), the
 * extra frames are applied verbatim.  If the recorded stream is longer, the
 * main thread rendered elements the background thread doesn't know about —
 * that is structural.
 */
function reconcileBatch(
  recorded: unknown[],
  incoming: unknown[],
): unknown[] | null {
  const patchOps: unknown[] = [];
  let ri = 0;
  let ii = 0;

  while (ri < recorded.length && ii < incoming.length) {
    const code = recorded[ri] as number;
    if (incoming[ii] !== code) return null;
    const arity = OP_ARITY[code];
    if (arity === undefined) return null; // unknown op — cannot walk safely
    if (ri + arity >= recorded.length || ii + arity >= incoming.length) {
      // Truncated frame on either side.
      return null;
    }

    const valueMode = VALUE_OP[code];
    // All arguments except a trailing "value" argument are identity-bearing
    // (element ids, prop keys, event names) and must match exactly.
    const strictArgs = valueMode === undefined ? arity : arity - 1;
    for (let k = 1; k <= strictArgs; k++) {
      if (!sameValue(recorded[ri + k], incoming[ii + k])) return null;
    }
    if (valueMode !== undefined) {
      const rVal = recorded[ri + arity];
      const iVal = incoming[ii + arity];
      if (valueMode === 'always' || !sameValue(rVal, iVal)) {
        for (let k = 0; k <= arity; k++) patchOps.push(incoming[ii + k]);
      }
    }

    ri += arity + 1;
    ii += arity + 1;
  }

  if (ri < recorded.length) return null;

  // Background produced additional trailing ops — apply them as-is.
  for (; ii < incoming.length; ii++) patchOps.push(incoming[ii]);

  return patchOps;
}

// ---------------------------------------------------------------------------
// Teardown fallback
// ---------------------------------------------------------------------------

/**
 * Remove every element the IFR render created and forget the recorded
 * stream, leaving only the page root.  Afterwards the background thread's
 * ops apply onto a clean page exactly as in a non-IFR build.
 */
function teardownIfrTree(): void {
  const createdIds = new Set<number>();
  const rootChildIds = new Set<number>();

  for (const batch of recordedBatches) {
    let i = 0;
    while (i < batch.length) {
      const code = batch[i] as number;
      const arity = OP_ARITY[code];
      if (arity === undefined) break; // unknown op — stop scanning this batch
      if (code === OP.CREATE || code === OP.CREATE_TEXT) {
        createdIds.add(batch[i + 1] as number);
      } else if (code === OP.INSERT) {
        const parentId = batch[i + 1] as number;
        const childId = batch[i + 2] as number;
        if (parentId === PAGE_ROOT_ID) rootChildIds.add(childId);
        else rootChildIds.delete(childId); // moved off the root
      } else if (code === OP.REMOVE) {
        const parentId = batch[i + 1] as number;
        if (parentId === PAGE_ROOT_ID) {
          rootChildIds.delete(batch[i + 2] as number);
        }
      }
      i += arity + 1;
    }
  }

  const page = elements.get(PAGE_ROOT_ID);
  if (page) {
    for (const id of rootChildIds) {
      const el = elements.get(id);
      if (el) __RemoveElement(page, el);
    }
    __FlushElementTree(page);
  }
  for (const id of createdIds) elements.delete(id);

  recordedBatches = [];
  batchCursor = 0;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Reset all IFR state and globals — for testing only. */
export function resetIfrForTesting(): void {
  phase = 'inactive';
  recordedBatches = [];
  batchCursor = 0;
  warnedPostHydrationOps = false;
  const g = globalThis as Record<string, unknown>;
  delete g['__VUE_LYNX_IFR_MT__'];
  delete g['__vueLynxIfrApplyOps'];
}

/** Current hydration phase — for testing/diagnostics only. */
export function getIfrPhase(): Phase {
  return phase;
}
