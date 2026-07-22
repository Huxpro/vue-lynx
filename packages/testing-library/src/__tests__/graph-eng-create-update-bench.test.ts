/**
 * Graph-eng create/update microbench across the four-axis matrix (M4, #325).
 *
 * Ops-level factorial: naming {dense, sparse} × staging {data, engine}
 * on the Vapor CLONE_TREE pipeline, two scenarios per cell:
 *
 *  - **create**: mount K template instances — the phase templates exist for.
 *  - **update**: write the text hole M times after mount — templates
 *    should NOT change this phase (the "ET benefits create, not update"
 *    anchor of the goal doc).
 *
 * Metrics per cell: BG ShadowElement allocations, ops-stream frames,
 * native PAPI call count (counted via wrappers), MT `elements` table size,
 * wall time. The engine cells run against the mocked
 * `__CreateElementTemplate` family (the real engine PAPI is absent in this
 * environment) and are labeled `engineFamily: 'mock'` — treat their timing
 * as protocol overhead, not an engine win.
 *
 * Output: packages/ifr-bench/results/graph-eng-create-update.json
 * (per-cell table + per-factor marginal deltas, consumed by
 * GRAPH-ENG-REPORT.md).
 */

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { OP, OP_ARITY } from 'vue-lynx/internal/ops';
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
const g = globalThis as Record<string, unknown>;

const STATIC_LEAVES = 24;
const CREATE_INSTANCES = 50;
const UPDATE_WRITES = 200;

afterEach(() => {
  resetTemplateState();
  resetMainThreadState();
  takeOps();
  ShadowElement.nextUid = 2;
  delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
  uninstallMockEngineFamily();
});

/** card: root view + 1 text hole + N static folded-text leaves. */
function buildProto(): ShadowElement {
  const root = new ShadowElement('view');
  root._inert = true;
  root._baseClass = 'card';

  const hole = new ShadowElement('text');
  hole._inert = true;
  const holeTx = new ShadowElement('#text');
  holeTx._inert = true;
  holeTx._text = ' ';
  hole._link(holeTx, null);
  root._link(hole, null);

  for (let i = 0; i < STATIC_LEAVES; i++) {
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

const SLOT_COUNT = 2 + STATIC_LEAVES; // root + hole + leaves (texts folded)

// --- native call counting ---------------------------------------------------

const COUNTED_PAPI = [
  '__CreateElement',
  '__CreateView',
  '__CreateText',
  '__CreateImage',
  '__AppendElement',
  '__InsertElementBefore',
  '__SetAttribute',
  '__SetClasses',
  '__SetInlineStyles',
  '__SetID',
  '__SetCSSId',
] as const;

function withNativeCallCount<T>(fn: () => T): { result: T; calls: number } {
  let calls = 0;
  const originals = new Map<string, unknown>();
  for (const name of COUNTED_PAPI) {
    const orig = g[name];
    if (typeof orig !== 'function') continue;
    originals.set(name, orig);
    g[name] = (...args: unknown[]) => {
      calls++;
      return (orig as (...a: unknown[]) => unknown)(...args);
    };
  }
  try {
    const result = fn();
    return { result, calls };
  } finally {
    for (const [name, orig] of originals) g[name] = orig;
  }
}

// --- mock engine family (same contract as engine-template.test.ts) ----------

interface MockProtoNode {
  tag: string;
  slot: number;
  attrs: [string, unknown][];
  children: MockProtoNode[];
}

function installMockEngineFamily(): void {
  g['__CreateElementTemplate'] = (tag: string, slot: number): MockProtoNode => (
    { tag, slot, attrs: [], children: [] }
  );
  g['__SetAttributeOfElementTemplate'] = (
    node: MockProtoNode,
    key: string,
    value: unknown,
  ): void => {
    node.attrs.push([key, value]);
  };
  g['__InsertNodeToElementTemplate'] = (
    parent: MockProtoNode,
    child: MockProtoNode,
  ): void => {
    parent.children.push(child);
  };
  g['__InstantiateElementTemplate'] = (
    handle: MockProtoNode,
    pageUniqueId: number,
    namedSlots: number[],
  ): unknown[] => {
    const bySlot = new Map<number, unknown>();
    const build = (proto: MockProtoNode): unknown => {
      const el = proto.tag === 'text' || proto.tag === '#text'
        ? (g['__CreateText'] as (p: number) => unknown)(pageUniqueId)
        : (g['__CreateElement'] as (t: string, p: number) => unknown)(
            proto.tag,
            pageUniqueId,
          );
      for (const [key, value] of proto.attrs) {
        if (key === 'class') {
          (g['__SetClasses'] as (e: unknown, v: unknown) => void)(el, value);
        } else if (key !== 'style' && key !== 'id') {
          (g['__SetAttribute'] as (e: unknown, k: string, v: unknown) => void)(
            el,
            key,
            value,
          );
        }
      }
      bySlot.set(proto.slot, el);
      for (const child of proto.children) {
        (g['__AppendElement'] as (p: unknown, c: unknown) => void)(
          el,
          build(child),
        );
      }
      return el;
    };
    build(handle);
    return namedSlots.map((s) => bySlot.get(s));
  };
}

function uninstallMockEngineFamily(): void {
  delete g['__CreateElementTemplate'];
  delete g['__SetAttributeOfElementTemplate'];
  delete g['__InsertNodeToElementTemplate'];
  delete g['__InstantiateElementTemplate'];
}

// --- cell runner ------------------------------------------------------------

function countFrames(ops: unknown[]): number {
  let frames = 0;
  let i = 0;
  while (i < ops.length) {
    const arity = (OP_ARITY as Record<number, number>)[ops[i] as number];
    if (arity === undefined) break;
    i += arity + 1;
    frames++;
  }
  return frames;
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

interface CellResult {
  cell: string;
  naming: 'dense' | 'sparse';
  staging: 'data' | 'engine';
  engineFamily: 'none' | 'mock';
  engineStatus: string;
  create: {
    shadowsPerInstance: number;
    opFrames: number;
    nativeCalls: number;
    mtNamed: number;
    wallMs: number;
  };
  update: {
    opFrames: number;
    nativeCalls: number;
    wallMs: number;
  };
}

function runCell(
  naming: 'dense' | 'sparse',
  staging: 'data' | 'engine',
): CellResult {
  resetTemplateState();
  resetMainThreadState();
  takeOps();

  if (staging === 'engine') {
    g['__VUE_LYNX_TEMPLATE_STAGING__'] = 'engine';
    installMockEngineFamily();
  } else {
    delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
    uninstallMockEngineFamily();
  }

  const proto = buildProto();
  ShadowElement.nextUid = 2;
  takeOps();

  setPendingVaporAddressing(
    naming === 'sparse'
      ? {
        holes: [1],
        addressed: [0, 1],
        slotCount: SLOT_COUNT,
        tags: ['view', 'text'],
      }
      : undefined,
  );

  // --- create ---------------------------------------------------------------
  const clones: ShadowElement[] = [];
  const holeUids: number[] = [];
  const t0 = performance.now();
  for (let k = 0; k < CREATE_INSTANCES; k++) {
    const clone = proto.cloneNode(true) as ShadowElement;
    clones.push(clone);
    holeUids.push(clone.uid + 1); // hole = slot 1 → base+1 in both namings
  }
  const createOps = takeOps();
  const { calls: createNative } = withNativeCallCount(() =>
    applyOps(createOps),
  );
  const createWall = performance.now() - t0;

  const created: CellResult['create'] = {
    shadowsPerInstance: countShadow(clones[0]!),
    opFrames: countFrames(createOps),
    nativeCalls: createNative,
    mtNamed: [...elements.keys()].filter((id) => id >= 2).length,
    wallMs: +createWall.toFixed(3),
  };

  // --- update ---------------------------------------------------------------
  const updateOps: unknown[] = [];
  for (let i = 0; i < UPDATE_WRITES; i++) {
    updateOps.push(
      OP.SET_TEXT,
      holeUids[i % holeUids.length]!,
      `v${i}`,
    );
  }
  const t1 = performance.now();
  const { calls: updateNative } = withNativeCallCount(() =>
    applyOps(updateOps),
  );
  const updateWall = performance.now() - t1;

  const engineStatus = String(
    g['__VUE_LYNX_ENGINE_ET_STATUS__'] ?? 'n/a',
  );

  return {
    cell: `vapor-${staging}-${naming}`,
    naming,
    staging,
    engineFamily: staging === 'engine' ? 'mock' : 'none',
    engineStatus,
    create: created,
    update: {
      opFrames: countFrames(updateOps),
      nativeCalls: updateNative,
      wallMs: +updateWall.toFixed(3),
    },
  };
}

describe('graph-eng create/update factorial (#325)', () => {
  it('measures naming × staging cells and factor deltas', () => {
    const cells = [
      runCell('dense', 'data'), // baseline: Named Tree
      runCell('sparse', 'data'), // naming main effect
      runCell('dense', 'engine'), // staging main effect (mock family)
      runCell('sparse', 'engine'), // combined
    ];

    const by = (n: string) => cells.find((c) => c.cell === n)!;
    const base = by('vapor-data-dense');
    const sparse = by('vapor-data-sparse');
    const engine = by('vapor-engine-dense');
    const both = by('vapor-engine-sparse');

    // Sanity: sparse names only the addressed closure.
    expect(sparse.create.mtNamed).toBeLessThan(base.create.mtNamed);
    expect(sparse.create.shadowsPerInstance).toBeLessThan(
      base.create.shadowsPerInstance,
    );
    // The wire cost of create is identical across cells (REGISTER once +
    // one CLONE_TREE per instance) — staging changes WHO builds, not what
    // is said.
    expect(sparse.create.opFrames).toBe(base.create.opFrames);
    expect(both.create.opFrames).toBe(base.create.opFrames);
    // Engine cells genuinely ran the mock family.
    expect(engine.engineStatus).toBe('native');
    expect(both.engineStatus).toBe('native');

    // The goal-doc anchor: update is template-agnostic. Identical frames
    // and native calls in every cell.
    for (const c of cells) {
      expect(c.update.opFrames).toBe(base.update.opFrames);
      expect(c.update.nativeCalls).toBe(base.update.nativeCalls);
    }

    const marginal = (a: CellResult, b: CellResult) => ({
      mtNamed: b.create.mtNamed - a.create.mtNamed,
      shadowsPerInstance:
        b.create.shadowsPerInstance - a.create.shadowsPerInstance,
      nativeCallsCreate: b.create.nativeCalls - a.create.nativeCalls,
      nativeCallsUpdate: b.update.nativeCalls - a.update.nativeCalls,
    });

    const report = {
      issue: 325,
      fixture: `card-${STATIC_LEAVES}-static-leaves-1-hole`,
      instances: CREATE_INSTANCES,
      updateWrites: UPDATE_WRITES,
      note:
        'Engine cells use the mocked __CreateElementTemplate family '
        + '(real engine PAPI absent here): correctness + protocol counts '
        + 'only, not an engine-speed claim.',
      cells,
      factors: {
        'naming dense→sparse (staging=data)': marginal(base, sparse),
        'staging data→engine (naming=dense, mock)': marginal(base, engine),
        'staging data→engine (naming=sparse, mock)': marginal(sparse, both),
      },
    };

    const outDir = path.resolve(_dirname, '../../../ifr-bench/results');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'graph-eng-create-update.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );

    console.log(
      `[graph-eng] create mtNamed dense=${base.create.mtNamed} `
        + `sparse=${sparse.create.mtNamed}; update frames identical: `
        + `${base.update.opFrames}`,
    );
  });
});
