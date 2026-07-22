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
    expect(ids).toContain('vapor-tree-block'); // product default
    expect(ids).toContain('vapor-tree-node'); // Named Tree
    expect(ids).toContain('vapor-native-block');
    // Legacy ids resolve to the same cells.
    expect(getCell('vdom-et')?.id).toBe('vdom-code-block');
    expect(getCell('vapor-dense')?.id).toBe('vapor-tree-node');
    expect(getCell('vapor-ifr')?.id).toBe('vapor-tree-block-ifr');
    expect(getCell('vapor-ifr-engine-et')?.id).toBe(
      'vapor-tree-block-ifr-native-paint',
    );
    // Explicit-coordinate duplicate is an alias, not a distinct cell.
    expect(getCell('vapor-ifr-sparse')?.aliasOf).toBe('vapor-tree-block-ifr');
  });

  it('prunes meaningless combinations', () => {
    for (const c of cells) {
      if (c.render === 'vdom') expect(c.staging).not.toBe('tree');
      if (c.render === 'vapor') expect(c.staging).not.toBe('ops');
      if (c.staging === 'code' || c.staging === 'native') {
        expect(c.naming).toBe('block');
      }
      expect(c.ifrPaint !== null).toBe(c.ifr);
    }
  });

  it('derives addressing / provider / lifetime columns', () => {
    expect(getCell('vdom-ops-node')?.addressing).toBe('random-access');
    expect(getCell('vapor-tree-node')?.addressing).toBe('traversal');
    expect(getCell('vapor-tree-block')?.addressing).toBe('traversal+recover');
    expect(getCell('vapor-native-block')?.providers).toEqual(['engine']);
    expect(getCell('vapor-tree-block-ifr')?.providers).toEqual(['bts', 'mts']);
    expect(getCell('vapor-tree-block-ifr')?.lifetimes).toEqual([
      'persistent',
      'ephemeral',
    ]);
    // Engine staging cannot be measured on hosts without the engine PAPI.
    expect(getCell('vapor-native-block')?.engineNaOnWeb).toBe(true);
    expect(
      getCell('vapor-tree-block-ifr-native-paint')?.engineNaOnWeb,
    ).toBe(true);
  });

  it('uses the unified mechanism terms', () => {
    expect(getCell('vapor-tree-node')?.term).toBe('Named Tree');
    expect(getCell('vapor-tree-block')?.term).toBe('Tree-Template');
    expect(getCell('vdom-code-block')?.term).toBe('Code-Template');
    expect(getCell('vapor-native-block')?.term).toBe('Engine-Template');
    expect(getCell('vdom-ops-node')?.term).toBe('Op Stream');
  });

  it('normalizes legacy spellings', () => {
    expect(normalizeStaging('opstream')).toBe('ops');
    expect(normalizeStaging('data')).toBe('tree');
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
        /^(ops|tree|code|native)\/(node|block)\/(random-access|traversal(\+recover)?)\/(BTS|Engine)(\+MTS)?\/persistent(\+ephemeral)?/,
      );
    }
  });
});
