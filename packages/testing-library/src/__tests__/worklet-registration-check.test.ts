/**
 * Unit coverage for the worklet registration cross-check logic.
 *
 * The pure functions here are what the WorkletRegistrationCheckPlugin runs
 * over compilation assets. Fixtures mirror the two real shapes the scan
 * meets: raw JS chunks (`registerWorkletInternal("main-thread", "h", fn)`,
 * `_wkltId: "h"`) and JSON-escaped code inside a `.bundle` envelope
 * (`\"h\"`).
 */

import { describe, expect, it } from 'vitest';

import {
  collectReferencedIds,
  collectRegisteredIds,
  findUnresolvedWorklets,
  formatUnresolvedMessage,
} from '../../../vue-lynx/plugin/src/plugins/worklet-registration-check-plugin.js';

const mtChunk = (ids: string[]) =>
  ids
    .map((id) => `registerWorkletInternal("main-thread", "${id}", function() {});`)
    .join('\n');

const bgChunk = (ids: string[]) =>
  ids.map((id) => `var o = { _wkltId: "${id}", _c: {} };`).join('\n');

describe('worklet registration cross-check', () => {
  it('extracts registered and referenced ids from raw JS', () => {
    expect([...collectRegisteredIds([mtChunk(['a:1', 'b:2'])])]).toEqual([
      'a:1',
      'b:2',
    ]);
    expect([...collectReferencedIds([bgChunk(['a:1', 'b:2'])])]).toEqual([
      'a:1',
      'b:2',
    ]);
  });

  it('reports nothing when every reference is registered', () => {
    const unresolved = findUnresolvedWorklets({
      mtSources: [mtChunk(['a:1', 'b:2', 'c:3'])],
      allSources: [bgChunk(['a:1', 'b:2', 'c:3'])],
    });
    expect(unresolved).toEqual([]);
  });

  it('flags a background reference missing from the main thread', () => {
    const unresolved = findUnresolvedWorklets({
      mtSources: [mtChunk(['a:1', 'c:3'])], // b:2 dropped (the extraction bug)
      allSources: [bgChunk(['a:1', 'b:2', 'c:3'])],
    });
    expect(unresolved).toEqual(['b:2']);
  });

  it('reads ids through JSON-escaped bundle envelopes', () => {
    // A .lynx/.web.bundle embeds chunk code as an escaped JSON string.
    const escaped = mtChunk(['a:1']).replace(/"/g, '\\"');
    expect([...collectRegisteredIds([escaped])]).toEqual(['a:1']);
  });

  it('bails when nothing is registered at all (wrong-stage guard)', () => {
    // References but zero registrations means the scan hit already-packaged
    // output; reporting all of them would be a false alarm, not a diagnosis.
    const unresolved = findUnresolvedWorklets({
      mtSources: [],
      allSources: [bgChunk(['a:1', 'b:2'])],
    });
    expect(unresolved).toEqual([]);
  });

  it('writes an actionable message naming the runtime symptom', () => {
    const msg = formatUnresolvedMessage(['b:2']);
    expect(msg).toContain('b:2');
    expect(msg).toContain("bind' of undefined");
    expect(msg).toContain('includeWorkletPackages');
  });
});
