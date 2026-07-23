/**
 * Five-axis matrix cell generation, terminology v2 (#321 / #325 revised).
 *
 * `legalCells()` is the single config object every harness derives its
 * cell list from; these tests pin the canonical ids, legacy aliases,
 * pruning rules, and coordinate labels.
 */

import { describe, expect, it } from 'vitest';

import {
  getCell,
  legalCells,
  normalizeIfrPaint,
  normalizeNaming,
  normalizeStaging,
} from '../../../vue-lynx/internal/src/matrix.js';

describe('legalCells (terminology v2)', () => {
  const cells = legalCells();

  it('has unique canonical ids with legacy aliases', () => {
    const ids = cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('vdom-ops-node');
    expect(ids).toContain('vdom-code-block'); // create-benefit cell
    expect(ids).toContain('vdom-code-block-ifr'); // first-class now
    expect(ids).toContain('vapor-data-block'); // product default
    expect(ids).toContain('vapor-data-node'); // Named Tree
    expect(ids).toContain('vapor-data-block-bundle'); // +b! (#338)
    expect(ids).toContain('vapor-code-block'); // +b:c (#337)
    expect(ids).toContain('vapor-code-block-ifr');
    expect(ids).toContain('vapor-native-block');
    // Legacy ids resolve to the same cells.
    expect(getCell('vdom-et')?.id).toBe('vdom-code-block');
    expect(getCell('vapor-bang')?.id).toBe('vapor-data-block-bundle');
    expect(getCell('vapor-code')?.id).toBe('vapor-code-block');
    expect(getCell('vapor-dense')?.id).toBe('vapor-data-node');
    expect(getCell('vapor-ifr')?.id).toBe('vapor-data-block-ifr');
    expect(getCell('vapor-ifr-engine-et')?.id).toBe(
      'vapor-data-block-ifr-native-paint',
    );
    // Explicit-coordinate duplicate is an alias, not a distinct cell.
    expect(getCell('vapor-ifr-sparse')?.aliasOf).toBe('vapor-data-block-ifr');
  });

  it('prunes meaningless combinations', () => {
    for (const c of cells) {
      if (c.render === 'vdom') expect(c.staging).not.toBe('data');
      if (c.render === 'vapor') expect(c.staging).not.toBe('ops');
      if (c.staging === 'code' || c.staging === 'native') {
        expect(c.naming).toBe('block');
      }
      expect(c.ifrPaint !== null).toBe(c.ifr);
    }
  });

  it('derives addressing / provider / lifetime columns', () => {
    expect(getCell('vdom-ops-node')?.addressing).toBe('random-access');
    expect(getCell('vapor-data-node')?.addressing).toBe('traversal');
    expect(getCell('vapor-data-block')?.addressing).toBe('traversal+recover');
    expect(getCell('vapor-native-block')?.providers).toEqual(['engine']);
    expect(getCell('vapor-data-block-ifr')?.providers).toEqual(['bts', 'mts']);
    expect(getCell('vapor-data-block-ifr')?.lifetimes).toEqual([
      'persistent',
      'ephemeral',
    ]);
    // Delivery: code rides the bundle; data/native ship over the wire by
    // default — `+b!` (#338) flips ONLY the delivery column on data staging.
    expect(getCell('vdom-ops-node')?.delivery).toBe(null);
    expect(getCell('vdom-code-block')?.delivery).toBe('bundle');
    expect(getCell('vapor-data-block')?.delivery).toBe('runtime');
    expect(getCell('vapor-data-block-bundle')?.delivery).toBe('bundle');
    expect(getCell('vapor-code-block')?.delivery).toBe('bundle');
    expect(getCell('vapor-native-block')?.delivery).toBe('runtime');
    // `+b!` differs from vapor-data-block in the delivery column ONLY
    // (status is lifecycle metadata, not a coordinate).
    const bang = getCell('vapor-data-block-bundle')!;
    const base = getCell('vapor-data-block')!;
    expect({ ...bang, id: '', legacyId: '', delivery: '', coordinate: '', status: '' })
      .toEqual({ ...base, id: '', legacyId: '', delivery: '', coordinate: '', status: '' });
    // Lifecycle status: product defaults are explicit; new/experimental
    // cells default to probe until promoted.
    expect(base.status).toBe('product');
    expect(bang.status).toBe('probe');
    expect(getCell('vapor-code')?.status).toBe('probe');
    expect(getCell('vdom-et')?.status).toBe('product');
    expect(getCell('vapor-engine')?.status).toBe('probe');
    // Engine staging cannot be measured on hosts without the engine PAPI.
    expect(getCell('vapor-native-block')?.engineNaOnWeb).toBe(true);
    expect(
      getCell('vapor-data-block-ifr-native-paint')?.engineNaOnWeb,
    ).toBe(true);
  });

  it('uses the unified mechanism terms', () => {
    expect(getCell('vapor-data-node')?.term).toBe('Named Tree');
    expect(getCell('vapor-data-block')?.term).toBe('Data-Template');
    expect(getCell('vdom-code-block')?.term).toBe('Code-Template');
    expect(getCell('vapor-native-block')?.term).toBe('Engine-Template');
    expect(getCell('vdom-ops-node')?.term).toBe('Op Stream');
  });

  it('normalizes legacy spellings', () => {
    expect(normalizeStaging('opstream')).toBe('ops');
    expect(normalizeStaging('tree')).toBe('data');
    expect(normalizeStaging('engine')).toBe('native');
    expect(normalizeStaging('code')).toBe('code');
    expect(normalizeNaming('dense')).toBe('node');
    expect(normalizeNaming('sparse')).toBe('block');
    expect(normalizeIfrPaint('disposable-et')).toBe('code-paint');
    expect(normalizeIfrPaint('engine-et')).toBe('native-paint');
  });

  it('stamps a five-axis coordinate on every cell', () => {
    for (const c of cells) {
      expect(c.coordinate).toMatch(
        /^(ops|data|code|native)\/(node|block)\/(random-access|traversal(\+recover)?)\/(BTS|Engine)(\+MTS)?\/persistent(\+ephemeral)?\/(runtime|bundle|—)/,
      );
    }
  });
});
