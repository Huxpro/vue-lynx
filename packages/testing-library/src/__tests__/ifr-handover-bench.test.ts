/**
 * IFR handover microbench (D1, `plans/0731-1-rl-render-to-opcodes-insights.md`).
 *
 * The browser FCP harness cannot resolve this factor: first paint happens
 * inside `renderPage`, *before* any hydration runs, so both handovers paint
 * identically and the difference lives entirely in what happens after the
 * background boots. This bench measures that directly, at the ops level:
 *
 *   MT phase  — paint a scene through the IFR recorder (`renderPage`).
 *   BG phase  — feed a second render of the same scene through
 *               `interceptPatchUpdate` + `completeIfrHydration`, counting
 *               wall time and native PAPI calls.
 *
 * Three background variants per scene:
 *   - `identical`  — the deterministic case both handovers are built for;
 *   - `tail`       — one extra card at the end (a divergence every real app
 *                    can hit: data that arrived between the two renders);
 *   - `head`       — the FIRST child differs (worst case for prefix
 *                    adoption, and the case stream handover detects earliest).
 *
 * Output: packages/ifr-bench/results/ifr-handover.json.
 */

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { OP, PAGE_ROOT_ID } from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  createPageRoot,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import {
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';
import {
  completeIfrHydration,
  enableIFR,
  getIfrAdoptionStats,
  getIfrPhase,
  interceptPatchUpdate,
  resetIfrForTesting,
} from '../../../vue-lynx/main-thread/src/ifr.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const g = globalThis as Record<string, unknown>;

const CARDS = 60;
const STATIC_LEAVES = 24;
/** root view + text hole + folded-text leaves. */
const SLOT_COUNT = 2 + STATIC_LEAVES;

const COUNTED_PAPI = [
  '__CreateElement',
  '__CreateView',
  '__CreateText',
  '__CreateImage',
  '__AppendElement',
  '__InsertElementBefore',
  '__RemoveElement',
  '__SetAttribute',
  '__SetClasses',
  '__SetInlineStyles',
  '__SetID',
  '__SetCSSId',
] as const;

function withNativeCallCount<T>(
  fn: () => T,
): { result: T; calls: number; byName: Record<string, number> } {
  let calls = 0;
  const byName: Record<string, number> = {};
  const originals = new Map<string, unknown>();
  for (const name of COUNTED_PAPI) {
    const orig = g[name];
    if (typeof orig !== 'function') continue;
    originals.set(name, orig);
    g[name] = (...args: unknown[]) => {
      calls++;
      byName[name] = (byName[name] ?? 0) + 1;
      return (orig as (...a: unknown[]) => unknown)(...args);
    };
  }
  try {
    const result = fn();
    return { result, calls, byName };
  } finally {
    for (const [name, orig] of originals) g[name] = orig;
  }
}

// ---------------------------------------------------------------------------
// Scenes — each builds a shadow tree under a fresh page root and returns the
// ops the background thread would ship.
// ---------------------------------------------------------------------------

type Variant = 'identical' | 'append' | 'middle';
const VARIANTS = ['identical', 'append', 'middle'] as const;
/** Card index whose lead element type differs in the `middle` variant. */
const MIDDLE_AT = 30;

/**
 * VDOM-shaped op stream, emitted directly against the wire protocol (one
 * CREATE/INSERT frame per node) so the scene does not depend on renderer
 * internals. Ids start at 2 in both realms, exactly like a fresh boot.
 */
function opsScene(variant: Variant): unknown[] {
  const ops: unknown[] = [];
  let uid = 2;
  const emitCard = (label: string, leadTag: string): number => {
    const card = uid++;
    ops.push(OP.CREATE, card, 'view', OP.SET_CLASS, card, 'card');
    const lead = uid++;
    ops.push(OP.CREATE, lead, leadTag);
    const leadText = uid++;
    ops.push(
      OP.CREATE_TEXT, leadText,
      OP.SET_TEXT, leadText, label,
      OP.INSERT, lead, leadText, -1,
      OP.INSERT, card, lead, -1,
    );
    for (let i = 0; i < STATIC_LEAVES; i++) {
      const leaf = uid++;
      ops.push(OP.CREATE, leaf, 'text', OP.SET_CLASS, leaf, `s${i}`);
      const tx = uid++;
      ops.push(
        OP.CREATE_TEXT, tx,
        OP.SET_TEXT, tx, `static-${i}`,
        OP.INSERT, leaf, tx, -1,
        OP.INSERT, card, leaf, -1,
      );
    }
    return card;
  };

  const n = variant === 'append' ? CARDS + 1 : CARDS;
  for (let k = 0; k < n; k++) {
    // `middle` swaps one card's lead element type halfway down the stream.
    const leadTag = variant === 'middle' && k === MIDDLE_AT ? 'image' : 'text';
    ops.push(OP.INSERT, PAGE_ROOT_ID, emitCard(`card-${k}`, leadTag), -1);
  }
  return ops;
}

/** Inert prototype for the Vapor scene: root view + text hole + static leaves. */
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
    const leaf = new ShadowElement('text');
    leaf._inert = true;
    leaf._baseClass = `s${i}`;
    const tx = new ShadowElement('#text');
    tx._inert = true;
    tx._text = `static-${i}`;
    leaf._link(tx, null);
    root._link(leaf, null);
  }
  return root;
}

/** Vapor-shaped op stream: REGISTER_TREE once + one CLONE_TREE per instance. */
function templateScene(variant: Variant): unknown[] {
  resetTemplateState();
  const proto = buildProto();

  ShadowElement.nextUid = 2;
  takeOps();
  setPendingVaporAddressing({
    holes: [1],
    addressed: [0, 1],
    slotCount: SLOT_COUNT,
    tags: ['view', 'text'],
  });

  const n = variant === 'append' ? CARDS + 1 : CARDS;
  const ops: unknown[] = [];
  for (let k = 0; k < n; k++) {
    if (variant === 'middle' && k === MIDDLE_AT) {
      // A non-template sibling halfway down: the divergence class stream
      // handover cannot absorb (it is neither a value diff nor a suffix).
      const extra = ShadowElement.nextUid++;
      ops.push(...takeOps());
      ops.push(
        OP.CREATE, extra, 'image',
        OP.INSERT, PAGE_ROOT_ID, extra, -1,
      );
    }
    const root = (proto.cloneNode(true) as ShadowElement).uid;
    // Per-card flush order: the clone frame, then its insert.
    ops.push(...takeOps());
    ops.push(OP.INSERT, PAGE_ROOT_ID, root, -1);
  }
  ops.push(...takeOps());
  return ops;
}

const SCENES = {
  ops: opsScene,
  template: templateScene,
} as const;

// ---------------------------------------------------------------------------

interface Row {
  scene: keyof typeof SCENES;
  handover: 'stream' | 'tree';
  variant: Variant;
  paintMs: number;
  paintNativeCalls: number;
  hydrateMs: number;
  hydrateNativeCalls: number;
  finalCards: number;
  claimed: number;
  paintedRoots: number;
  hydrateByName: Record<string, number>;
}

function run(
  scene: keyof typeof SCENES,
  handover: 'stream' | 'tree',
  variant: Variant,
): Row {
  resetMainThreadState();
  resetIfrForTesting();
  resetTemplateState();
  g['__VUE_LYNX_IFR_HANDOVER__'] = handover;

  // --- MT paint -------------------------------------------------------------
  const mtOps = SCENES[scene]('identical');
  enableIFR();
  g['__vueLynxIfrMountApps'] = (): void => {
    (g['__vueLynxIfrApplyOps'] as (ops: unknown[]) => void)(mtOps);
  };
  const t0 = performance.now();
  const { calls: paintNativeCalls } = withNativeCallCount(() => {
    (g['renderPage'] as (d: unknown) => void)({});
  });
  const paintMs = performance.now() - t0;
  expect(getIfrPhase()).toBe('rendered');

  // --- BG render + hydration ------------------------------------------------
  const bgOps = SCENES[scene](variant);
  const payload = JSON.stringify(bgOps);
  const t1 = performance.now();
  let stats = getIfrAdoptionStats();
  const { calls: hydrateNativeCalls, byName: hydrateByName } = withNativeCallCount(() => {
    interceptPatchUpdate(payload);
    stats = getIfrAdoptionStats();
    completeIfrHydration();
  });
  const hydrateMs = performance.now() - t1;
  expect(getIfrPhase()).toBe('hydrated');

  // Cards are the `view` children directly under the page; the divergence
  // variants add a non-view sibling, so counting by tag isolates them.
  const page = elements.get(PAGE_ROOT_ID) as unknown as Element;
  const finalCards = [...page.children].filter(
    (el) => el.tagName.toLowerCase() === 'view',
  ).length;

  return {
    scene,
    handover,
    variant,
    paintMs: +paintMs.toFixed(3),
    paintNativeCalls,
    hydrateMs: +hydrateMs.toFixed(3),
    hydrateNativeCalls,
    finalCards,
    claimed: stats.claimed,
    paintedRoots: stats.paintedRoots,
    hydrateByName,
  };
}

afterEach(() => {
  resetIfrForTesting();
  resetMainThreadState();
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
  delete g['__VUE_LYNX_IFR_HANDOVER__'];
  delete g['__vueLynxIfrMountApps'];
});

describe('IFR handover microbench (D1)', () => {
  it('measures stream vs tree handover across scenes and divergences', () => {
    const rows: Row[] = [];
    for (const scene of ['ops', 'template'] as const) {
      for (const variant of VARIANTS) {
        for (const handover of ['stream', 'tree'] as const) {
          // Wall time on a shared host is noisy; PAPI counts are exact.
          const reps = [0, 1, 2].map(() => run(scene, handover, variant));
          const median = (xs: number[]): number =>
            [...xs].sort((a, b) => a - b)[1]!;
          const row = reps[0]!;
          row.paintMs = median(reps.map((r) => r.paintMs));
          row.hydrateMs = median(reps.map((r) => r.hydrateMs));
          rows.push(row);
        }
      }
    }

    const out = {
      cards: CARDS,
      staticLeavesPerCard: STATIC_LEAVES,
      note:
        'Wall times are single-shot on a shared CI host — read the native '
        + 'call counts as the load-independent signal.',
      rows,
    };
    const target = path.resolve(
      _dirname,
      '../../../ifr-bench/results/ifr-handover.json',
    );
    fs.writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);

    // eslint-disable-next-line no-console
    console.log(
      `\n${'scene/handover/variant'.padEnd(30)}${'paint ms'.padStart(9)}`
        + `${'paint PAPI'.padStart(11)}`
        + `${'hyd ms'.padStart(9)}${'hyd PAPI'.padStart(10)}`
        + `${'claimed'.padStart(12)}`,
    );
    for (const r of rows) {
      // eslint-disable-next-line no-console
      console.log(
        `${`${r.scene}/${r.handover}/${r.variant}`.padEnd(30)}`
          + `${r.paintMs.toFixed(1).padStart(9)}`
          + `${String(r.paintNativeCalls).padStart(11)}`
          + `${r.hydrateMs.toFixed(1).padStart(9)}`
          + `${String(r.hydrateNativeCalls).padStart(10)}`
          + `${`${r.claimed}/${r.paintedRoots}`.padStart(12)}`
          + `  ${JSON.stringify(r.hydrateByName)}`,
      );
    }

    // Correctness first: every configuration must land on the background's
    // tree, whatever route it took to get there.
    for (const r of rows) {
      const expected = r.variant === 'append' ? CARDS + 1 : CARDS;
      expect(
        r.finalCards,
        `${r.scene}/${r.handover}/${r.variant}`,
      ).toBe(expected);
    }

    const at = (
      scene: string,
      handover: string,
      variant: string,
    ): Row => rows.find(
      (r) => r.scene === scene && r.handover === handover
        && r.variant === variant,
    )!;

    // The claim D1 is built on: on divergence, stream handover rebuilds the
    // page while tree handover touches the diverging nodes only.
    for (const scene of ['ops', 'template'] as const) {
      // Mid-stream structural divergence is the class stream handover pays a
      // full page rebuild for and tree handover resolves locally.
      expect(
        at(scene, 'tree', 'middle').hydrateNativeCalls,
        `${scene}/middle: tree must not rebuild the page`,
      ).toBeLessThan(at(scene, 'stream', 'middle').hydrateNativeCalls);
      // A pure suffix append is already graceful under stream handover
      // (the recorded stream is a strict prefix), so tree must not be worse.
      expect(
        at(scene, 'tree', 'append').hydrateNativeCalls,
        `${scene}/append: tree must not regress`,
      ).toBeLessThanOrEqual(at(scene, 'stream', 'append').hydrateNativeCalls);
    }

    // A benchmark, not a unit test: the default 5s budget is not enough
    // when the suite runs it alongside 39 other files.
  }, 120_000);
});
