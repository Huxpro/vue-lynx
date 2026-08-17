// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `:e` axis end-to-end verification (#323 durable / #324 native-paint).
 *
 * TWO axis values route to the engine rung via `engineStagingRequested()`:
 *   - `+b:e`   → `templateStaging: 'engine'`  (durable tree)
 *   - `+ifr:e` → `ifrPaint: 'engine-et'` + `__VUE_LYNX_IFR_MT__ === true`
 *                (throwaway IFR first frame only)
 *
 * `engine-template.test.ts` covers `+b:e`; the paint sibling was only ever
 * asserted at the matrix-metadata level (`normalizeIfrPaint('engine-et')`),
 * never driven through `applyOps`. This file drives BOTH cells against a
 * mock `__CreateElementTemplate` family and pins the three properties that
 * make the rung honest:
 *
 *   (a) family present → status `native`, the family is actually called,
 *       and the painted tree + registry match the interpreter's exactly;
 *   (b) family absent   → status `stub`, no throw, byte-identical output;
 *   (c) family present but `__InstantiateElementTemplate` throws →
 *       downgrades to `stub` and the interpreter still paints.
 *
 * The mock mirrors the interpreter's own PAPI sequence (typed creator →
 * `__SetCSSId` → static props → append) so any tree divergence is a real
 * routing/bookkeeping bug, not mock infidelity. It proves plumbing, NOT
 * latency: this host has no engine, so native timing here is meaningless.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OP, type TemplateNode } from 'vue-lynx/internal/ops';
import {
  applyOps,
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';
import {
  ENGINE_ET_STATUS_GLOBAL,
  getEngineTemplateStatus,
} from '../../../vue-lynx/main-thread/src/engine-template.js';

const g = globalThis as unknown as Record<string, unknown>;

// Nested card: a static text hole, a nested row holding an anonymous image,
// a BG-only comment anchor, an empty-text anchor, and a tail text — enough
// to exercise materializability, nesting, and anonymous skeleton nodes.
// slots: 0=view 1=text 2=view(row) 3=image 4=#comment 5=#text('') 6=text
const STRUCTURE: TemplateNode = [
  'view',
  { c: 'card' },
  [
    ['text', { c: 'label', t: 'hello' }, []],
    [
      'view',
      { c: 'row' },
      [
        ['image', { a: [['src', 'x.png']] }, []],
        ['#comment', 0, []],
        ['#text', 0, []],
        ['text', { c: 'tail', t: 'tail' }, []],
      ],
    ],
  ],
];

// ---------------------------------------------------------------------------
// Mock engine family (prototype build + clone through the real PAPI)
// ---------------------------------------------------------------------------

interface MockProtoNode {
  tag: string;
  slot: number;
  attrs: [string, unknown][];
  children: MockProtoNode[];
}

interface FamilyCalls {
  create: number;
  setAttribute: number;
  insertNode: number;
  instantiate: number;
}

function installMockEngineFamily(calls: FamilyCalls, opts: {
  throwOnInstantiate?: boolean;
  /** Stamp every element the mock clones, to prove who painted the tree. */
  stamp?: boolean;
} = {}): void {
  g['__CreateElementTemplate'] = (tag: string, slot: number): MockProtoNode => {
    calls.create++;
    return { tag, slot, attrs: [], children: [] };
  };
  g['__SetAttributeOfElementTemplate'] = (
    node: MockProtoNode,
    key: string,
    value: unknown,
  ): void => {
    calls.setAttribute++;
    node.attrs.push([key, value]);
  };
  g['__InsertNodeToElementTemplate'] = (
    parent: MockProtoNode,
    child: MockProtoNode,
  ): void => {
    calls.insertNode++;
    parent.children.push(child);
  };
  g['__InstantiateElementTemplate'] = (
    handle: MockProtoNode,
    pageUniqueId: number,
    namedSlots: number[],
  ): unknown[] => {
    calls.instantiate++;
    if (opts.throwOnInstantiate) throw new Error('engine says no');
    const bySlot = new Map<number, unknown>();
    // Mirror createTypedElement + __SetCSSId + applyStaticProps exactly, so
    // the cloned tree is comparable to the interpreter's node for node.
    const create = (tag: string): unknown => {
      switch (tag) {
        case 'view':
        case 'div':
          return (g['__CreateView'] as (p: number) => unknown)(pageUniqueId);
        case 'text':
        case '#text':
          return (g['__CreateText'] as (p: number) => unknown)(pageUniqueId);
        case 'image':
          return (g['__CreateImage'] as (p: number) => unknown)(pageUniqueId);
        case 'scroll-view':
          return (g['__CreateScrollView'] as (p: number) => unknown)(
            pageUniqueId,
          );
        default:
          return (g['__CreateElement'] as (t: string, p: number) => unknown)(
            tag,
            pageUniqueId,
          );
      }
    };
    const build = (proto: MockProtoNode): unknown => {
      const el = create(proto.tag);
      (g['__SetCSSId'] as (e: unknown[], v: number) => void)([el], 0);
      if (opts.stamp) {
        (g['__SetAttribute'] as (e: unknown, k: string, v: unknown) => void)(
          el,
          'painted-by',
          'engine',
        );
      }
      for (const [key, value] of proto.attrs) {
        if (key === 'class') {
          (g['__SetClasses'] as (e: unknown, v: unknown) => void)(el, value);
        } else if (key === 'style') {
          (g['__SetInlineStyles'] as (e: unknown, v: unknown) => void)(
            el,
            value,
          );
        } else if (key === 'id') {
          (g['__SetID'] as (e: unknown, v: unknown) => void)(el, value);
        } else {
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
  delete g['__CreateTypedElementTemplate'];
  delete g['__SetAttributeOfElementTemplate'];
  delete g['__InsertNodeToElementTemplate'];
  delete g['__InstantiateElementTemplate'];
}

// ---------------------------------------------------------------------------
// Cell driver
// ---------------------------------------------------------------------------

type Cell = 'baseline' | '+b:e' | '+ifr:e';
type Mode = 'native' | 'stub' | 'throw';

interface SerializedNode {
  tag: string;
  attrs: Record<string, string>;
  /** Own text (the env maps the `text` attribute onto textContent). */
  text: string;
  children: SerializedNode[];
}

/**
 * Structural snapshot of a native subtree. Attribute keys are sorted so the
 * snapshot is order-insensitive: the engine path installs the `vue-ref-N`
 * selector attribute after the static props, the dense interpreter before
 * them, and that ordering difference is not a divergence.
 */
function serialize(el: Element | undefined): SerializedNode | null {
  if (!el) return null;
  const attrs: Record<string, string> = {};
  for (const name of Array.from(el.attributes)
    .map((a) => a.name)
    .sort()) {
    attrs[name] = el.getAttribute(name)!;
  }
  return {
    tag: el.tagName.toLowerCase(),
    attrs,
    text: Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? '')
      .join(''),
    children: Array.from(el.children).map((c) => serialize(c)!),
  };
}

function applyDefines(cell: Cell): string {
  delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
  delete g['__VUE_LYNX_IFR_PAINT__'];
  delete g['__VUE_LYNX_IFR_MT__'];
  if (cell === '+b:e') {
    g['__VUE_LYNX_TEMPLATE_STAGING__'] = 'engine';
    return "STAGING='engine'";
  }
  if (cell === '+ifr:e') {
    g['__VUE_LYNX_IFR_PAINT__'] = 'engine-et';
    g['__VUE_LYNX_IFR_MT__'] = true;
    return "IFR_PAINT='engine-et' + IFR_MT=true";
  }
  return '(none)';
}

interface CellResult {
  defines: string;
  status: string;
  publishedStatus: unknown;
  calls: FamilyCalls;
  tree: SerializedNode | null;
  keys: number[];
  threw: boolean;
}

function runCell(
  cell: Cell,
  mode: Mode,
  addressed: number[] | 0,
  base: number,
): CellResult {
  resetMainThreadState();
  uninstallMockEngineFamily();
  const defines = applyDefines(cell);
  const calls: FamilyCalls = {
    create: 0,
    setAttribute: 0,
    insertNode: 0,
    instantiate: 0,
  };
  if (mode !== 'stub') {
    installMockEngineFamily(calls, { throwOnInstantiate: mode === 'throw' });
  }

  let threw = false;
  try {
    applyOps([
      OP.REGISTER_TREE, 1, STRUCTURE, addressed,
      OP.CLONE_TREE, 1, base,
    ]);
  } catch {
    threw = true;
  }

  const root = elements.get(base) as unknown as Element | undefined;
  const keys = [...elements.keys()]
    .filter((k) => k >= base)
    .sort((a, b) => a - b);
  return {
    defines,
    status: getEngineTemplateStatus(),
    publishedStatus: g[ENGINE_ET_STATUS_GLOBAL],
    calls,
    tree: serialize(root),
    keys,
    threw,
  };
}

// ---------------------------------------------------------------------------
// Verdict table (printed, per STEP 3)
// ---------------------------------------------------------------------------

interface VerdictRow {
  cell: string;
  naming: string;
  mode: string;
  defines: string;
  status: string;
  familyCalls: string;
  outputOk: boolean;
  pass: boolean;
}

const verdicts: VerdictRow[] = [];

function record(
  cell: string,
  naming: string,
  mode: string,
  r: CellResult,
  expectedStatus: string,
  baseline: CellResult,
  expectFamilyCalled: boolean,
): void {
  const outputOk =
    !r.threw
    && r.tree !== null
    && JSON.stringify(r.tree) === JSON.stringify(baseline.tree)
    && JSON.stringify(r.keys) === JSON.stringify(baseline.keys);
  const called = r.calls.instantiate > 0 && r.calls.create > 0;
  verdicts.push({
    cell,
    naming,
    mode,
    defines: r.defines,
    status: `${r.status} (published: ${String(r.publishedStatus)})`,
    familyCalls: `create=${r.calls.create} setAttr=${r.calls.setAttribute} `
      + `insert=${r.calls.insertNode} instantiate=${r.calls.instantiate}`,
    outputOk,
    pass:
      !r.threw
      && r.status === expectedStatus
      && outputOk
      && called === expectFamilyCalled,
  });
}

function printVerdicts(): void {
  const head = [
    'cell', 'naming', 'mode', 'defines', 'status', 'family calls', 'output',
    'verdict',
  ];
  const rows = verdicts.map((v) => [
    v.cell,
    v.naming,
    v.mode,
    v.defines,
    v.status,
    v.familyCalls,
    v.outputOk ? 'ok' : 'DIVERGENT',
    v.pass ? 'PASS' : 'FAIL',
  ]);
  const widths = head.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i]!.length)),
  );
  const line = (cols: string[]): string =>
    '| ' + cols.map((c, i) => c.padEnd(widths[i]!)).join(' | ') + ' |';
  console.log('\n[:e axis verdict] mock PAPI family, no real engine\n');
  console.log(line(head));
  console.log('|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|');
  for (const r of rows) console.log(line(r));
  const failed = verdicts.filter((v) => !v.pass).length;
  console.log(
    `\n${verdicts.length - failed}/${verdicts.length} cells PASS`
      + (failed ? ` — ${failed} FAIL` : ''),
  );
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  (globalThis as any).lynxTestingEnv.switchToMainThread();
  resetMainThreadState();
});

afterEach(() => {
  uninstallMockEngineFamily();
  delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
  delete g['__VUE_LYNX_IFR_PAINT__'];
  delete g['__VUE_LYNX_IFR_MT__'];
  resetMainThreadState();
});

// Sparse names view/label/row/comment/tail; the image stays anonymous.
const SPARSE_ADDRESSED = [0, 1, 2, 4, 6];

describe.each([
  ['+b:e', '+b:e' as Cell],
  ['+ifr:e', '+ifr:e' as Cell],
])('%s routes to the engine rung end-to-end', (label, cell) => {
  describe.each([
    ['dense', 0 as const],
    ['sparse', SPARSE_ADDRESSED],
  ])('%s naming', (naming, addressed) => {
    const base = 1000;

    it('(a) native: family drives the paint, tree matches the interpreter', () => {
      const baseline = runCell('baseline', 'stub', addressed, base);
      const native = runCell(cell, 'native', addressed, base);

      expect(native.threw).toBe(false);
      expect(native.status).toBe('native');
      expect(native.publishedStatus).toBe('native');
      // The mock PAPI was genuinely exercised, not bypassed.
      expect(native.calls.create).toBeGreaterThan(0);
      expect(native.calls.insertNode).toBeGreaterThan(0);
      expect(native.calls.instantiate).toBeGreaterThan(0);
      // …and produced the interpreter's tree + registry, node for node.
      expect(native.tree).not.toBeNull();
      expect(native.tree).toEqual(baseline.tree);
      expect(native.keys).toEqual(baseline.keys);

      record(label, naming, 'native', native, 'native', baseline, true);
    });

    it('(b) stub: no family → status stub, no throw, identical output', () => {
      const baseline = runCell('baseline', 'stub', addressed, base);
      const stub = runCell(cell, 'stub', addressed, base);

      expect(stub.threw).toBe(false);
      expect(stub.status).toBe('stub');
      expect(stub.publishedStatus).toBe('stub');
      expect(stub.tree).toEqual(baseline.tree);
      expect(stub.keys).toEqual(baseline.keys);

      record(label, naming, 'stub', stub, 'stub', baseline, false);
    });

    it('(c) throw: instantiate failure downgrades to stub and still paints', () => {
      const baseline = runCell('baseline', 'stub', addressed, base);
      const thrown = runCell(cell, 'throw', addressed, base);

      // Fail-safe: the error never escapes applyOps…
      expect(thrown.threw).toBe(false);
      // …the family WAS reached (so this is a genuine downgrade, not a skip)…
      expect(thrown.calls.instantiate).toBeGreaterThan(0);
      // …status is honest…
      expect(thrown.status).toBe('stub');
      expect(thrown.publishedStatus).toBe('stub');
      // …and the interpreter painted the tree anyway.
      expect(thrown.tree).toEqual(baseline.tree);
      expect(thrown.keys).toEqual(baseline.keys);

      record(label, naming, 'throw', thrown, 'stub', baseline, true);
    });

    it('provenance: the native tree really came from the mock family', () => {
      // Tree parity alone cannot tell a genuine engine clone from a silent
      // fall-through to the interpreter (both produce the same tree). Stamp
      // every element the mock clones: under `native` EVERY node must carry
      // the stamp, under `stub` none may.
      const stamped = (base_: number, mode: Mode): string[] => {
        resetMainThreadState();
        uninstallMockEngineFamily();
        applyDefines(cell);
        const calls: FamilyCalls = {
          create: 0, setAttribute: 0, insertNode: 0, instantiate: 0,
        };
        if (mode === 'native') installMockEngineFamily(calls, { stamp: true });
        applyOps([
          OP.REGISTER_TREE, 1, STRUCTURE, addressed,
          OP.CLONE_TREE, 1, base_,
        ]);
        const root = elements.get(base_) as unknown as Element;
        return [root, ...Array.from(root.querySelectorAll('*'))].map(
          (el) => el.getAttribute('painted-by') ?? 'interpreter',
        );
      };

      const native = stamped(5000, 'native');
      expect(native.length).toBeGreaterThan(1);
      expect(new Set(native)).toEqual(new Set(['engine']));

      const stub = stamped(6000, 'stub');
      expect(new Set(stub)).toEqual(new Set(['interpreter']));
    });
  });
});

describe('+ifr:e gating', () => {
  it('does not engage outside the IFR main-thread window', () => {
    resetMainThreadState();
    const calls: FamilyCalls = {
      create: 0,
      setAttribute: 0,
      insertNode: 0,
      instantiate: 0,
    };
    installMockEngineFamily(calls);
    // Paint requested, but enableIFR never set the runtime MT flag.
    g['__VUE_LYNX_IFR_PAINT__'] = 'engine-et';
    applyOps([OP.REGISTER_TREE, 1, STRUCTURE, 0, OP.CLONE_TREE, 1, 2000]);

    expect(calls.create).toBe(0);
    expect(calls.instantiate).toBe(0);
    expect(getEngineTemplateStatus()).toBe('unprobed');
    expect(elements.has(2000)).toBe(true); // interpreter painted it
  });

  it('later ops target engine-painted handles (SET_CLASS + INSERT)', () => {
    resetMainThreadState();
    const calls: FamilyCalls = {
      create: 0,
      setAttribute: 0,
      insertNode: 0,
      instantiate: 0,
    };
    installMockEngineFamily(calls);
    g['__VUE_LYNX_IFR_PAINT__'] = 'engine-et';
    g['__VUE_LYNX_IFR_MT__'] = true;
    applyOps([OP.REGISTER_TREE, 1, STRUCTURE, 0, OP.CLONE_TREE, 1, 3000]);
    expect(getEngineTemplateStatus()).toBe('native');

    // Dense uids: 3000=view 3001=label 3002=row 3003=image (4/5 anchors) 3006=tail
    applyOps([OP.SET_CLASS, 3003, 'patched']);
    expect(
      (elements.get(3003) as unknown as Element).getAttribute('class'),
    ).toBe('patched');

    const child = 9000;
    applyOps([
      OP.CREATE, child, 'view',
      OP.SET_CLASS, child, 'injected',
      OP.INSERT, 3002, child, -1,
    ]);
    const row = elements.get(3002) as unknown as Element;
    const classes = Array.from(row.children).map((n) => n.getAttribute('class'));
    expect(classes[classes.length - 1]).toBe('injected');
  });

  it('hydration adopts the engine-painted first frame (uids survive commit)', () => {
    // The ephemeral frame is painted under the IFR MT window; hydration then
    // runs with the flags cleared and must resolve the same uids.
    resetMainThreadState();
    const calls: FamilyCalls = {
      create: 0,
      setAttribute: 0,
      insertNode: 0,
      instantiate: 0,
    };
    installMockEngineFamily(calls);
    g['__VUE_LYNX_IFR_PAINT__'] = 'engine-et';
    g['__VUE_LYNX_IFR_MT__'] = true;
    applyOps([OP.REGISTER_TREE, 1, STRUCTURE, SPARSE_ADDRESSED, OP.CLONE_TREE, 1, 4000]);
    expect(getEngineTemplateStatus()).toBe('native');
    const painted = serialize(elements.get(4000) as unknown as Element);

    // IFR window closes — BG thread takes over and replays its updates.
    delete g['__VUE_LYNX_IFR_MT__'];
    applyOps([OP.SET_TEXT, 4001, 'hydrated']);
    const label = elements.get(4001) as unknown as Element;
    // The env maps the `text` attribute onto textContent for <text>.
    expect(label.textContent).toBe('hydrated');
    // Adoption did not re-create the tree, only mutated it in place.
    expect(serialize(elements.get(4000) as unknown as Element)?.tag).toBe(
      painted?.tag,
    );
    expect(calls.instantiate).toBe(1);
  });
});

describe(':e axis verdict table', () => {
  it('prints the per-cell verdict and every cell passes', () => {
    printVerdicts();
    expect(verdicts.length).toBeGreaterThan(0);
    expect(verdicts.filter((v) => !v.pass)).toEqual([]);
  });
});
