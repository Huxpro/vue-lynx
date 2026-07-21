/**
 * Graph-eng naming-density microbench (#301).
 *
 * Quantifies what sparse A2 saves today: ShadowElement shells + MT named
 * map entries. Native skeleton cost is unchanged (#300's job).
 */

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { OP } from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import {
  applyOps,
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

afterEach(() => {
  resetTemplateState();
  resetMainThreadState();
  takeOps();
  ShadowElement.nextUid = 2;
});

function buildStaticHeavyProto(staticLeaves: number): ShadowElement {
  const root = new ShadowElement('view');
  root._inert = true;
  root._baseClass = 'card';
  for (let i = 0; i < staticLeaves; i++) {
    const t = new ShadowElement('text');
    t._inert = true;
    t._baseClass = `s${i}`;
    const tx = new ShadowElement('#text');
    tx._inert = true;
    tx._text = `static-${i}`;
    t._link(tx, null);
    root._link(t, null);
  }
  return root;
}

function countShadow(el: ShadowElement): number {
  let n = 1;
  let c = el.firstChild;
  while (c) {
    n += countShadow(c);
    c = c.next;
  }
  return n;
}

describe('graph-eng sparse A2 microbench (#301)', () => {
  it('reports ShadowElement + MT named savings for root-only sparse', () => {
    const staticLeaves = 24;
    const proto = buildStaticHeavyProto(staticLeaves);
    const slotCount = 1 + staticLeaves; // folded only-child texts

    const run = (sparse: boolean) => {
      resetTemplateState();
      resetMainThreadState();
      takeOps();
      ShadowElement.nextUid = 2;

      setPendingVaporAddressing(
        sparse
          ? {
            holes: [0],
            addressed: [0],
            slotCount,
            tags: ['view'],
          }
          : undefined,
      );

      const N = 100;
      const t0 = performance.now();
      let last!: ShadowElement;
      for (let i = 0; i < N; i++) last = proto.cloneNode(true) as ShadowElement;
      const cloneMs = (performance.now() - t0) / N;
      const ops = takeOps();
      applyOps(ops);

      const reg = ops.indexOf(OP.REGISTER_TREE);
      const addressedOr0 = ops[reg + 3];
      return {
        mode: Array.isArray(addressedOr0) ? 'sparse' : 'dense',
        shadows: countShadow(last),
        mtNamed: [...elements.keys()].filter((id) => id >= 2).length,
        cloneMs: +cloneMs.toFixed(4),
        addressedCount: Array.isArray(addressedOr0)
          ? addressedOr0.length
          : slotCount,
      };
    };

    const dense = run(false);
    const sparse = run(true);

    expect(dense.mode).toBe('dense');
    expect(sparse.mode).toBe('sparse');
    expect(sparse.shadows).toBe(1);
    expect(sparse.mtNamed).toBe(1);
    expect(dense.shadows).toBeGreaterThan(sparse.shadows);
    expect(dense.mtNamed).toBeGreaterThan(sparse.mtNamed);

    const report = {
      issue: 301,
      axis: 'naming-density',
      fixture: `static-heavy-${staticLeaves}-leaves`,
      note:
        'Native skeleton still fully built either way; FCP win needs #300. '
        + 'This measures BG shells + MT elements map only.',
      dense,
      sparse,
      savings: {
        shadowsPct: +((1 - sparse.shadows / dense.shadows) * 100).toFixed(1),
        mtNamedPct: +((1 - sparse.mtNamed / dense.mtNamed) * 100).toFixed(1),
      },
    };

    const outDir = path.resolve(_dirname, '../../../ifr-bench/results');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'graph-eng-sparse-microbench.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );

    // eslint-disable-next-line no-console
    console.log(
      `[graph-eng] dense shadows=${dense.shadows} mtNamed=${dense.mtNamed} | `
        + `sparse shadows=${sparse.shadows} mtNamed=${sparse.mtNamed} `
        + `(−${report.savings.shadowsPct}% / −${report.savings.mtNamedPct}%)`,
    );
  });
});
