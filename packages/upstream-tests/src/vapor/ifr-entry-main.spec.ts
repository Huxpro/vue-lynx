/** Entry bootstrap regressions that require a fresh module evaluation. */

import { expect, it, vi } from 'vitest';

import { createIfrPapiTestEnv } from './ifr-papi-test-env.js';

it('preserves a host-provided SystemInfo object by identity', async () => {
  const globals = globalThis as Record<string, unknown>;
  const papi = createIfrPapiTestEnv(() => undefined);
  const hostSystemInfo = Object.freeze({
    platform: 'host-owned',
    pixelRatio: 3,
  });

  try {
    const lynxSystemInfo = (
      globals['lynx'] as { SystemInfo: Record<string, unknown> }
    ).SystemInfo;
    expect(lynxSystemInfo).not.toBe(hostSystemInfo);
    globals['SystemInfo'] = hostSystemInfo;

    // Force entry-main's top-level bootstrap to run in this isolated host
    // state even if another spec evaluated it in the same Vitest worker.
    vi.resetModules();
    await import('../../../vue-lynx/main-thread/src/entry-main.js');

    expect(globals['SystemInfo']).toBe(hostSystemInfo);
  } finally {
    papi.restore();
  }
});
