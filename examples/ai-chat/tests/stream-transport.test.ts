import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  currentStreamEnvironment,
  selectStreamTransport,
} from '../src/lib/stream-transport';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('selectStreamTransport', () => {
  it('uses polling on native Lynx unless standard streaming was enabled', () => {
    expect(selectStreamTransport({ nativeLynx: true })).toBe('poll');
    expect(
      selectStreamTransport({ nativeLynx: true, standardStreamingFetch: true }),
    ).toBe('sse');
  });

  it('uses SSE on web', () => {
    expect(selectStreamTransport({ nativeLynx: false })).toBe('sse');
  });
});

describe('currentStreamEnvironment', () => {
  it('recognizes the Lynx web background thread without relying on document', () => {
    vi.stubGlobal('SystemInfo', { platform: 'web' });

    expect(currentStreamEnvironment()).toMatchObject({ nativeLynx: false });
  });

  it('recognizes native Lynx from SystemInfo.platform', () => {
    vi.stubGlobal('SystemInfo', { platform: 'iOS' });

    expect(currentStreamEnvironment()).toMatchObject({ nativeLynx: true });
  });
});
