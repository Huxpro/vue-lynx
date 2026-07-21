// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Instant First-Frame Rendering for the pure Vapor entry.
 *
 * When `enableIFR: true`, the main-thread bundle contains the Vue runtime +
 * user app. Both threads run the same Vapor template protocol in fresh
 * realms, so initial op streams are deterministic:
 *
 *   1. `renderPage` mounts on the main thread during `loadTemplate` and
 *      applies ops locally (first frame without a cross-thread round-trip).
 *      Applied batches are recorded; the stream is sealed when the sync
 *      first-screen mount returns (`sealIfrRender`).
 *   2. The background thread boots and renders the same app.
 *   3. Hydration compares BG batches against the recorded stream —
 *      identical structural frames are skipped, values/worklets are adopted
 *      from BG, and a structural mismatch falls back to replaying the
 *      complete background history.
 *
 * Events use the same sign strings (`vue:N`) on both sides. Worklet event
 * contexts are always re-applied from BG (needs `_execId` for
 * `runOnBackground`).
 */

import {
  IFR_APPLY_OPS_GLOBAL,
  IFR_MOUNT_APPS_GLOBAL,
  IFR_MT_FLAG_GLOBAL,
  OP,
  OP_ARITY,
  PAGE_ROOT_ID,
} from 'vue-lynx/internal/ops';

import {
  elements,
  pageUniqueId,
  setPageUniqueId,
} from './element-registry.js';
import { isPlatformInfoAttr } from './list-apply.js';
import {
  applyOps,
  beginIfrSelectorAttributeDeferral,
  clearIfrSelectorAttributeDeferral,
  commitIfrSelectorAttributes,
  resetMainThreadState,
} from './ops-apply.js';

const ARITY = OP_ARITY as Readonly<Record<number, number | undefined>>;

export type IfrPhase = 'inactive' | 'enabled' | 'rendered' | 'hydrated';

let phase: IfrPhase = 'inactive';
let recordedOps: unknown[] = [];
let recordedCursor = 0;
let backgroundHistory: unknown[][] = [];
let warnedPostHydrationOps = false;
let renderSealed = false;
let inSyncRender = false;

/**
 * Value-bearing frames whose final payload does not define tree identity.
 * Background worklet contexts and refs are always authoritative because only
 * that realm has the final execution id and reactive ownership.
 */
const VALUE_OP: Readonly<Record<number, 'patch' | 'always'>> = {
  [OP.SET_PROP]: 'patch',
  [OP.SET_TEXT]: 'patch',
  [OP.SET_EVENT]: 'patch',
  [OP.SET_STYLE]: 'patch',
  [OP.SET_CLASS]: 'patch',
  [OP.SET_ID]: 'patch',
  [OP.SET_WORKLET_EVENT]: 'always',
  [OP.SET_MT_REF]: 'always',
  [OP.INIT_MT_REF]: 'always',
};

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a === null
    || b === null
    || typeof a !== 'object'
    || typeof b !== 'object'
  ) {
    return false;
  }

  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b)) return false;
  if (aIsArray) {
    const aArray = a as unknown[];
    const bArray = b as unknown[];
    if (aArray.length !== bArray.length) return false;
    for (let i = 0; i < aArray.length; i++) {
      if (!sameValue(aArray[i], bArray[i])) return false;
    }
    return true;
  }

  const aObject = a as Record<string, unknown>;
  const bObject = b as Record<string, unknown>;
  const aKeys = Object.keys(aObject);
  if (aKeys.length !== Object.keys(bObject).length) return false;
  for (const key of aKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(bObject, key)
      || !sameValue(aObject[key], bObject[key])
    ) {
      return false;
    }
  }
  return true;
}

/** Install the globals consumed by the Vapor runtime in the IFR realm. */
export function enableIFR(): void {
  const g = globalThis as Record<string, unknown>;
  g[IFR_MT_FLAG_GLOBAL] = true;
  g['__VUE_LYNX_IFR_ENABLED__'] = true;
  g[IFR_APPLY_OPS_GLOBAL] = recordAndApply;
  g['__vueLynxIfrSealOps'] = sealIfrRender;

  // Native Lepus realms have no timers. Dev builds of the user graph reach
  // setTimeout during module evaluation (e.g. runtime-core's devtools-hook
  // replay buffer sees the Vapor dom-shim's `window`), which is outside the
  // runIfrRender fallback boundary — an uncaught throw there kills renderPage
  // for the whole page, not just IFR. A timer that never fires is the correct
  // semantic for the disposable MT realm: everything after handoff is
  // discarded anyway.
  if (typeof g['setTimeout'] !== 'function') {
    g['setTimeout'] = (): number => 0;
    g['clearTimeout'] = (): void => undefined;
  }
  phase = 'enabled';
  recordedOps = [];
  recordedCursor = 0;
  backgroundHistory = [];
  warnedPostHydrationOps = false;
  renderSealed = false;
  inSyncRender = false;
}

function recordAndApply(ops: unknown[]): void {
  // Drop once the first-screen snapshot is sealed or BG owns the tree.
  // Setup-time async work (Suspense / defineAsyncComponent) must not extend
  // the recorded stream: a structural mismatch would tear down IFR and apply
  // only an incremental BG batch onto an empty page.
  if (phase === 'hydrated' || renderSealed) {
    if (__DEV__ && !warnedPostHydrationOps) {
      warnedPostHydrationOps = true;
      console.warn(
        '[vue-lynx] IFR: dropping main-thread render ops produced after '
          + 'the first-screen snapshot. First-screen code must not keep '
          + 'updating on the main thread (side effects belong in onMounted '
          + '/ watchers, which only run on the background thread).',
      );
    }
    return;
  }

  recordedOps.push(...ops);
  applyOps(ops, !inSyncRender);
}

/** Freeze the MT first-frame stream before the Background realm starts. */
export function sealIfrRender(): void {
  renderSealed = true;
}

/** Run the app mounts deferred by the Vapor runtime inside renderPage. */
export function runIfrRender(): void {
  if (phase === 'inactive') return;

  recordedOps = [];
  recordedCursor = 0;
  backgroundHistory = [];
  phase = 'enabled';
  renderSealed = false;

  const trigger = (globalThis as Record<string, unknown>)[
    IFR_MOUNT_APPS_GLOBAL
  ] as (() => void) | undefined;
  if (!trigger) return;

  beginIfrSelectorAttributeDeferral();
  try {
    inSyncRender = true;
    try {
      trigger();
      phase = 'rendered';
    } finally {
      inSyncRender = false;
    }
  } catch (error) {
    console.error(
      '[vue-lynx] IFR first-screen render failed; falling back to the '
        + 'background render.',
      error,
    );
    try {
      clearIfrSelectorAttributeDeferral();
      teardownIfrTree();
    } catch (cleanupError) {
      // renderPage must remain a no-throw boundary even when a partially
      // applied native tree also fails cleanup. The BG path remains the last
      // available recovery mechanism.
      console.error(
        '[vue-lynx] IFR first-screen cleanup failed; continuing with the '
          + 'background render.',
        cleanupError,
      );
    } finally {
      finishHydration(false);
    }
  }
}

/**
 * Called after the Background entry and all of its initial ops have applied.
 * A remaining MT tail is real divergence, not an incomplete BG batch.
 */
export function completeIfrHydration(): void {
  if (phase !== 'rendered') return;
  if (recordedCursor < recordedOps.length) {
    fallbackToBackground();
  } else {
    finishHydration();
  }
}

/**
 * Consume one background batch while hydration is active.
 *
 * Recorded and incoming batch boundaries are deliberately ignored: only op
 * frame boundaries matter. This accepts a main-thread flush split into
 * several BG batches as well as several main-thread flushes coalesced into a
 * single BG batch.
 */
export function interceptPatchUpdate(data: string): boolean {
  if (phase !== 'rendered') return false;

  const incoming = JSON.parse(data) as unknown[];
  backgroundHistory.push(incoming);

  // A render that emitted no operations cannot be reconciled. Hand ownership
  // to BG and let entry-main apply this batch through the normal path.
  if (recordedOps.length === 0) {
    finishHydration();
    return false;
  }

  const patchOps: unknown[] = [];
  let incomingCursor = 0;

  while (incomingCursor < incoming.length) {
    // The background produced valid trailing frames after matching the whole
    // first-screen stream. They are normal BG updates and apply verbatim.
    if (recordedCursor >= recordedOps.length) {
      patchOps.push(...incoming.slice(incomingCursor));
      incomingCursor = incoming.length;
      break;
    }

    const recordedCode = recordedOps[recordedCursor] as number;
    const incomingCode = incoming[incomingCursor] as number;
    const recordedArity = ARITY[recordedCode];
    const incomingArity = ARITY[incomingCode];

    if (
      recordedCode !== incomingCode
      || recordedArity === undefined
      || incomingArity === undefined
      || recordedArity !== incomingArity
      || recordedCursor + recordedArity >= recordedOps.length
      || incomingCursor + incomingArity >= incoming.length
    ) {
      fallbackToBackground();
      return true;
    }

    const valueMode = VALUE_OP[recordedCode];
    const strictArguments = valueMode === undefined
      ? recordedArity
      : recordedArity - 1;
    let matches = true;
    for (let offset = 1; offset <= strictArguments; offset++) {
      if (!sameValue(
        recordedOps[recordedCursor + offset],
        incoming[incomingCursor + offset],
      )) {
        matches = false;
        break;
      }
    }
    if (!matches) {
      fallbackToBackground();
      return true;
    }

    if (valueMode !== undefined) {
      const recordedValue = recordedOps[recordedCursor + recordedArity];
      const incomingValue = incoming[incomingCursor + incomingArity];
      if (
        recordedCode === OP.SET_PROP
        && isPlatformInfoAttr(String(incoming[incomingCursor + 2]))
        && !sameValue(recordedValue, incomingValue)
      ) {
        // List platform metadata is committed through update-list-info when
        // the item is inserted. A later SET_PROP only updates our JS map and
        // cannot repair the already-reported native item, so rebuild it from
        // the authoritative BG history.
        fallbackToBackground();
        return true;
      }
      if (
        valueMode === 'always'
        || !sameValue(recordedValue, incomingValue)
      ) {
        patchOps.push(
          ...incoming.slice(
            incomingCursor,
            incomingCursor + incomingArity + 1,
          ),
        );
      }
    }

    recordedCursor += recordedArity + 1;
    incomingCursor += incomingArity + 1;
  }

  if (patchOps.length > 0) {
    try {
      applyOps(patchOps);
    } catch (error) {
      // A failed in-place patch leaves the adopted tree in an unknown state;
      // the complete buffered BG history is still available, so rebuild from
      // it instead of letting the throw escape vuePatchUpdate into Lepus.
      console.error(
        '[vue-lynx] IFR hydration patch failed; replaying the complete '
          + 'background render.',
        error,
      );
      fallbackToBackground();
      return true;
    }
  }

  if (recordedCursor >= recordedOps.length) finishHydration();
  return true;
}

function fallbackToBackground(): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] IFR hydration mismatch: the background render differs '
        + 'structurally from the main-thread first frame. Replaying the '
        + 'complete background render.',
    );
  }

  // Keep the history before teardown resets protocol registries. Replaying
  // batch-by-batch preserves normal REMOVE/INSERT and list flush semantics.
  const history = backgroundHistory;
  clearIfrSelectorAttributeDeferral();
  try {
    teardownIfrTree();
    for (const batch of history) applyOps(batch);
  } catch (error) {
    // vuePatchUpdate must remain a no-throw boundary. There is no further
    // recovery below the authoritative replay itself; log and keep whatever
    // portion of the BG tree was rebuilt.
    console.error(
      '[vue-lynx] IFR fallback replay failed; the page may be incomplete.',
      error,
    );
  } finally {
    finishHydration(false);
  }
}

function finishHydration(adoptIfrTree = true): void {
  if (adoptIfrTree) commitIfrSelectorAttributes();
  else clearIfrSelectorAttributeDeferral();
  phase = 'hydrated';
  renderSealed = true;
  recordedOps = [];
  recordedCursor = 0;
  backgroundHistory = [];
}

/**
 * Remove roots painted by IFR, reset every protocol registry, then reseed the
 * existing native page handle and its component unique id. The page itself
 * must survive fallback because Lynx owns it outside Vue's op protocol.
 */
function teardownIfrTree(): void {
  const rootChildren = new Set<number>();
  let cursor = 0;
  while (cursor < recordedOps.length) {
    const code = recordedOps[cursor] as number;
    const arity = ARITY[code];
    if (arity === undefined || cursor + arity >= recordedOps.length) break;

    if (code === OP.INSERT) {
      const parentId = recordedOps[cursor + 1] as number;
      const childId = recordedOps[cursor + 2] as number;
      if (parentId === PAGE_ROOT_ID) rootChildren.add(childId);
      else rootChildren.delete(childId);
    } else if (code === OP.REMOVE) {
      const parentId = recordedOps[cursor + 1] as number;
      if (parentId === PAGE_ROOT_ID) {
        rootChildren.delete(recordedOps[cursor + 2] as number);
      }
    }

    cursor += arity + 1;
  }

  const page = elements.get(PAGE_ROOT_ID);
  const nativePageUniqueId = pageUniqueId;
  if (page) {
    for (const childId of rootChildren) {
      const child = elements.get(childId);
      if (child) __RemoveElement(page, child);
    }
    if (rootChildren.size > 0) __FlushElementTree(page);
  }

  // Clears elements, parent/child indices, Vapor templates, list state, and
  // the external worklet-ref map. Then restore the engine-owned page entry.
  resetMainThreadState();
  if (page) elements.set(PAGE_ROOT_ID, page);
  setPageUniqueId(nativePageUniqueId);
}

/** Reset IFR module state and bridge globals between tests/realms. */
export function resetIfrForTesting(): void {
  clearIfrSelectorAttributeDeferral();
  phase = 'inactive';
  recordedOps = [];
  recordedCursor = 0;
  backgroundHistory = [];
  warnedPostHydrationOps = false;
  renderSealed = false;
  inSyncRender = false;

  const g = globalThis as Record<string, unknown>;
  delete g[IFR_MT_FLAG_GLOBAL];
  delete g['__VUE_LYNX_IFR_ENABLED__'];
  delete g[IFR_APPLY_OPS_GLOBAL];
  delete g[IFR_MOUNT_APPS_GLOBAL];
  delete g['__vueLynxIfrSealOps'];
}

/** Current state for diagnostics and protocol tests. */
export function getIfrPhase(): IfrPhase {
  return phase;
}
