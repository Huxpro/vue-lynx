/**
 * Vitest setup file for Vue runtime-dom upstream tests.
 *
 * Creates a LynxTestingEnv, wires up the dual-thread pipeline,
 * and initialises the runtime-dom bridge so patchProp calls route
 * through our BG→MT→PAPI→jsdom pipeline.
 *
 * This mirrors packages/vue/testing-library/setup.ts but adds the
 * bridge initialisation step.
 */

import { JSDOM } from 'jsdom';
import { LynxTestingEnv } from '@lynx-js/testing-environment';
import { initBridge, resetBridge } from './lynx-runtime-dom-bridge.js';

// --- Create the testing environment -----------------------------------------

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const lynxTestingEnv = new LynxTestingEnv({
  window: jsdom.window as unknown as Window & typeof globalThis,
});

globalThis.lynxTestingEnv = lynxTestingEnv;

// --- Wire Main Thread globals -----------------------------------------------

lynxTestingEnv.switchToMainThread();

// Stub registerWorkletInternal — entry-main.ts may contain demo worklet
// registrations that require the worklet-runtime chunk (not available in tests).
if (
  typeof (globalThis as Record<string, unknown>)['registerWorkletInternal']
    === 'undefined'
) {
  (globalThis as Record<string, unknown>)['registerWorkletInternal'] = () => {};
}

// The main-thread entry-main.ts sets globalThis.renderPage, vuePatchUpdate, etc.
await import('vue-lynx/main-thread');

// Capture the functions set on globalThis by entry-main.ts
const mainThreadFns = {
  renderPage: (globalThis as Record<string, unknown>)['renderPage'],
  vuePatchUpdate: (globalThis as Record<string, unknown>)['vuePatchUpdate'],
  processData: (globalThis as Record<string, unknown>)['processData'],
  updatePage: (globalThis as Record<string, unknown>)['updatePage'],
  updateGlobalProps:
    (globalThis as Record<string, unknown>)['updateGlobalProps'],
};

// Store on the main thread globalThis so they survive resets.
Object.assign(
  lynxTestingEnv.mainThread.globalThis as Record<string, unknown>,
  mainThreadFns,
);

// --- Import ops-apply internals for the bridge ------------------------------

// ops-apply.ts exports applyOps, elements, resetMainThreadState.
// Since it's the same Node.js process, module-level state is shared
// across thread contexts.
const { applyOps, elements, resetMainThreadState } = await import(
  '../../vue-lynx/main-thread/src/ops-apply.js'
);

// --- Wire Background Thread globals ----------------------------------------

lynxTestingEnv.switchToBackgroundThread();

// Import entry-background which sets publishEvent on lynxCoreInject.tt and globalThis.
await import('vue-lynx/entry-background');

// Capture the publishEvent function reference for re-wiring after resets.
const publishEventFn = (globalThis as Record<string, unknown>)['publishEvent'];

// Also store on the BG thread globalThis.
(lynxTestingEnv.backgroundThread.globalThis as Record<string, unknown>)[
  'publishEvent'
] = publishEventFn;

// --- Initialise the bridge --------------------------------------------------

initBridge({ applyOps, elements, resetMainThreadState });

// --- Setup hooks for post-reset re-wiring ----------------------------------

// `lynxTestingEnv.reset()` re-injects both threads' globals from scratch
// (fresh `lynxCoreInject.tt`, etc.). These public @lynx-js/testing-environment
// hooks re-apply the pipeline functions onto the freshly injected thread
// globals; the thread switches inside `reset()` then copy them onto the live
// globalThis. Installed via Object.assign because TS disallows re-assigning
// the hooks' global function declarations.
Object.assign(globalThis, {
  onInjectMainThreadGlobals: (globals: Record<string, unknown>): void => {
    Object.assign(globals, mainThreadFns);
  },
  onInjectBackgroundThreadGlobals: (globals: Record<string, unknown>): void => {
    globals['publishEvent'] = publishEventFn;
    const tt = (globals['lynxCoreInject'] as
      | { tt?: Record<string, unknown> }
      | undefined)?.tt;
    if (tt) {
      tt['publishEvent'] = publishEventFn;
    }
  },
});

// --- Per-test reset ---------------------------------------------------------

beforeEach(() => {
  // Reset bridge + runtime state
  resetBridge();

  // Clear jsdom body
  jsdom.window.document.body.innerHTML = '';
});

// Stay on background thread (tests start on BG by default).
