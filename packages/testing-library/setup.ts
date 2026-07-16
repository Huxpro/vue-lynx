/**
 * Vitest setup file for Vue Lynx testing library.
 *
 * Creates a LynxTestingEnv, wires up the dual-thread pipeline:
 * - Main Thread: renderPage, vuePatchUpdate (PAPI ops executor)
 * - Background Thread: publishEvent, lynx.getNativeApp().callLepusMethod
 *
 * This runs BEFORE any test module is imported, so by the time Vue's runtime
 * modules load, all ambient globals (lynx, lynxCoreInject, __MAIN_THREAD__, etc.)
 * are already in place.
 *
 * Vue-specific pipeline state survives `lynxTestingEnv.reset()` via the public
 * setup hooks of @lynx-js/testing-environment (`onInjectMainThreadGlobals`,
 * `onInjectBackgroundThreadGlobals`).
 */

import { JSDOM } from 'jsdom';
import { LynxTestingEnv } from '@lynx-js/testing-environment';

// --- Create the testing environment -----------------------------------------

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const lynxTestingEnv = new LynxTestingEnv({
  window: jsdom.window as unknown as Window & typeof globalThis,
});

// Expose globally so render() / fireEvent() can access it.
globalThis.lynxTestingEnv = lynxTestingEnv;

// --- Wire Main Thread globals -----------------------------------------------

lynxTestingEnv.switchToMainThread();

// Stub registerWorkletInternal — entry-main.ts may contain demo worklet
// registrations that require the worklet-runtime chunk (not available in tests).
if (typeof (globalThis as any).registerWorkletInternal === 'undefined') {
  (globalThis as any).registerWorkletInternal = () => {};
}

// The main-thread entry-main.ts sets globalThis.renderPage, vuePatchUpdate, etc.
await import('vue-lynx/main-thread');

// Capture the functions set on globalThis by entry-main.ts
const mainThreadFns = {
  renderPage: (globalThis as any).renderPage,
  vuePatchUpdate: (globalThis as any).vuePatchUpdate,
  processData: (globalThis as any).processData,
  updatePage: (globalThis as any).updatePage,
  updateGlobalProps: (globalThis as any).updateGlobalProps,
};

// Also store them on the main thread globalThis so they survive thread switches.
Object.assign(lynxTestingEnv.mainThread.globalThis as object, mainThreadFns);

// --- Wire Background Thread globals ----------------------------------------

lynxTestingEnv.switchToBackgroundThread();

// Import entry-background which sets publishEvent on lynxCoreInject.tt and globalThis.
await import('vue-lynx/entry-background');

// Capture the publishEvent function reference for re-wiring after resets.
const publishEventFn = (globalThis as any).publishEvent;

// Also store on the BG thread globalThis.
(lynxTestingEnv.backgroundThread.globalThis as any).publishEvent =
  publishEventFn;

// --- Setup hooks for post-reset re-wiring ----------------------------------

// `lynxTestingEnv.reset()` re-injects both threads' globals from scratch
// (fresh `lynxCoreInject.tt`, etc.), which would drop the Vue pipeline
// functions wired above. These hooks re-apply them onto the freshly injected
// thread globals; the thread switches inside `reset()` then copy them onto
// the live globalThis.
//
// The hooks are declared as global functions by @lynx-js/testing-environment,
// so they must be installed via Object.assign (TS disallows re-assigning
// function declarations).
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

// Stay on background thread (tests start on BG by default).
