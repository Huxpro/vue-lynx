/**
 * Minimal setup for local (non-upstream) tests that exercise the vue-lynx
 * BG-thread renderer directly, without the full DOM bridge pipeline.
 *
 * The vue-lynx flush module sends ops to the main thread via
 * `lynx.getNativeApp().callLepusMethod('vuePatchUpdate', ...)`.  In the test
 * environment `lynx` is not defined, so we stub it here.
 *
 * We also capture the JSON-serialised ops that `doFlush` passes to
 * `callLepusMethod` and re-push them into a test-accessible buffer so that
 * tests can inspect them via `collectFlushedOps()` after awaiting `nextTick`.
 */

import { OP } from 'vue-lynx/internal/ops';

// ---------------------------------------------------------------------------
// Captured ops buffer
// ---------------------------------------------------------------------------

// Ops that doFlush() sent to callLepusMethod (after JSON round-trip).
let _capturedOps: unknown[] = [];

/**
 * Return and clear all ops that have been flushed to the "main thread" since
 * the last call.  Call this after `await nextTick()` instead of `takeOps()`.
 */
export function collectFlushedOps(): unknown[] {
  const ops = _capturedOps;
  _capturedOps = [];
  return ops;
}

export function resetCapturedOps(): void {
  _capturedOps = [];
}

// ---------------------------------------------------------------------------
// lynx stub
// ---------------------------------------------------------------------------

const lynxStub = {
  getNativeApp() {
    return {
      callLepusMethod(
        _method: string,
        params: { data: string },
        callback: () => void,
      ) {
        // Deserialise and capture the ops for test assertions.
        const ops: unknown[] = JSON.parse(params.data);
        _capturedOps.push(...ops);
        // Simulate synchronous MT acknowledgement.
        callback();
      },
    };
  },
};

// Install as a global so flush.ts's `declare var lynx` reference resolves.
(globalThis as Record<string, unknown>)['lynx'] = lynxStub;

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetCapturedOps();
});

// Re-export OP for convenience in tests that import from this file.
export { OP };
