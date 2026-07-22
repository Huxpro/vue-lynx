/**
 * Four-axis matrix cell generation (#321 / #325, goal doc §6).
 *
 * `legalCells()` is the single config object every harness derives its
 * cell list from; these tests pin the pruning rules and the zero-regression
 * defaults.
 */

import { describe, expect, it } from 'vitest';

import {
  getCell,
  legalCells,
} from '../../../vue-lynx/internal/src/matrix.js';

describe('legalCells (goal doc §6)', () => {
  const cells = legalCells();

  it('has unique, stable ids', () => {
    const ids = cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    // §6 minimum coverage anchors.
    expect(ids).toContain('vdom-opstream-dense'); // op stream baseline
    expect(ids).toContain('vdom-code-sparse'); // JS ET create-benefit cell
    expect(ids).toContain('vapor-data-dense'); // Named Tree
    expect(ids).toContain('vapor-data-sparse'); // A1→A2 body cell
    expect(ids).toContain('vapor-data-sparse-ifr'); // product IFR
    expect(ids).toContain('vapor-data-sparse-ifr-engine-et');
    expect(ids).toContain('vapor-engine-sparse'); // Engine-Template
    expect(ids).toContain('vdom-engine-sparse');
  });

  it('prunes meaningless combinations', () => {
    for (const c of cells) {
      // VDOM has no data staging (no CLONE_TREE); Vapor no opstream.
      if (c.render === 'vdom') expect(c.staging).not.toBe('data');
      if (c.render === 'vapor') expect(c.staging).not.toBe('opstream');
      // Templates are definitionally sparse.
      if (c.staging === 'code' || c.staging === 'engine') {
        expect(c.naming).toBe('sparse');
      }
      // ifrPaint exists iff ifr.
      expect(c.ifrPaint !== null).toBe(c.ifr);
    }
  });

  it('derives provenance from the render model (axis C is a label)', () => {
    for (const c of cells) {
      if (c.naming === 'dense') expect(c.provenance).toBe('none');
      else if (c.render === 'vdom') expect(c.provenance).toBe('intrinsic');
      else expect(c.provenance).toBe('recovered');
    }
  });

  it('uses the unified terminology for mechanism names', () => {
    expect(getCell('vapor-data-dense')?.term).toBe('Named Tree');
    expect(getCell('vapor-data-sparse')?.term).toBe('Data-Template');
    expect(getCell('vdom-code-sparse')?.term).toBe('Code-Template');
    expect(getCell('vapor-engine-sparse')?.term).toBe('Engine-Template');
    expect(getCell('vdom-opstream-dense')?.term).toBe('Op Stream');
  });

  it('stamps a four-axis coordinate on every cell', () => {
    for (const c of cells) {
      expect(c.coordinate).toMatch(
        /^(Opstream|Data|Code|Engine)\/(Dense|Sparse)\/(intrinsic|recovered|—)\/Split·Durable/,
      );
    }
  });
});
