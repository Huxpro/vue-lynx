/**
 * Randomized BG↔MT naming parity (M1, #322).
 *
 * For random template structures and random ancestor-closed addressed sets,
 * the sparse contract must hold: the BG uid block (allocated by
 * buildShadowCloneSparse) and the MT named set (registered by
 * instantiateTemplateSparse) are the same `base + indexInAddressed` set,
 * modulo BG-only anchors (#comment / empty #text) which the MT never
 * materializes.
 *
 * The reference structure is NOT re-derived here: the first (dense) clone's
 * own REGISTER_TREE payload is the oracle, so any fold-rule drift shows up
 * as a parity failure instead of being replicated into the test.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { OP, type TemplateNode } from 'vue-lynx/internal/ops';
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

afterEach(() => {
  resetTemplateState();
  resetMainThreadState();
  takeOps();
  ShadowElement.nextUid = 2;
});

/** Deterministic PRNG so failures are reproducible by seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random inert proto: view/text/image elements, comments, text leaves. */
function buildRandomProto(rand: () => number, depth = 0): ShadowElement {
  const el = new ShadowElement(depth === 0 || rand() < 0.5 ? 'view' : 'text');
  el._inert = true;
  if (rand() < 0.5) el._baseClass = `c${Math.floor(rand() * 10)}`;

  const childCount = depth >= 3 ? 0 : Math.floor(rand() * 4);
  if (childCount === 0 && rand() < 0.5) {
    // Only-child text — exercises the fold rule.
    const tx = new ShadowElement('#text');
    tx._inert = true;
    tx._text = rand() < 0.3 ? ' ' : `t${Math.floor(rand() * 100)}`;
    el._link(tx, null);
    return el;
  }
  for (let i = 0; i < childCount; i++) {
    const roll = rand();
    if (roll < 0.2) {
      const c = new ShadowElement('#comment');
      c._inert = true;
      el._link(c, null);
    } else if (roll < 0.35) {
      const t = new ShadowElement('#text');
      t._inert = true;
      t._text = rand() < 0.5 ? '' : `s${Math.floor(rand() * 100)}`;
      el._link(t, null);
    } else if (roll < 0.55) {
      const img = new ShadowElement('image');
      img._inert = true;
      img._attrs = new Map([['src', `i${Math.floor(rand() * 10)}.png`]]);
      el._link(img, null);
    } else {
      el._link(buildRandomProto(rand, depth + 1), null);
    }
  }
  return el;
}

interface SlotInfo {
  tag: string;
  parent: number | null;
}

/** Preorder slots straight from the REGISTER_TREE payload (the oracle). */
function slotsFromStructure(structure: TemplateNode): SlotInfo[] {
  const out: SlotInfo[] = [];
  const walk = (node: TemplateNode, parent: number | null): void => {
    const slot = out.length;
    out.push({ tag: node[0], parent });
    for (const child of node[2]) walk(child, slot);
  };
  walk(structure, null);
  return out;
}

/** Random ancestor-closed addressed set containing the root. */
function randomAddressed(
  slots: SlotInfo[],
  rand: () => number,
): number[] {
  const picked = new Set<number>([0]);
  for (let s = 1; s < slots.length; s++) {
    if (rand() < 0.35) picked.add(s);
  }
  // Ancestor closure — BG skips whole subtrees of unaddressed nodes.
  for (const s of [...picked]) {
    let p = slots[s]!.parent;
    while (p !== null) {
      picked.add(p);
      p = slots[p]!.parent;
    }
  }
  return [...picked].sort((a, b) => a - b);
}

function collectBgBlockUids(root: ShadowElement, base: number): Set<number> {
  const out = new Set<number>();
  const walk = (n: ShadowElement): void => {
    if (!(n.tag === '#text' && n._textHost) && n.uid >= base) out.add(n.uid);
    let c = n.firstChild;
    while (c) {
      walk(c);
      c = c.next;
    }
  };
  walk(root);
  return out;
}

describe('randomized sparse parity: BG uid block ≡ MT named set', () => {
  const RUNS = 40;
  for (let seed = 1; seed <= RUNS; seed++) {
    it(`seed ${seed}`, () => {
      resetTemplateState();
      resetMainThreadState();
      takeOps();

      // Two protos from identical PRNG streams — the template cache is
      // keyed per proto, so pass 2 must not inherit pass 1's dense cache.
      const protoDense = buildRandomProto(mulberry32(seed * 7919));
      const proto = buildRandomProto(mulberry32(seed * 7919));
      const rand = mulberry32(seed * 104729);

      // Pass 1 (dense, no metadata): obtain the authoritative structure.
      ShadowElement.nextUid = 2;
      setPendingVaporAddressing(undefined);
      protoDense.cloneNode(true);
      const denseOps = takeOps();
      const reg = denseOps.indexOf(OP.REGISTER_TREE);
      expect(reg).toBeGreaterThanOrEqual(0);
      const structure = denseOps[reg + 2] as TemplateNode;
      const slots = slotsFromStructure(structure);

      // Pass 2 (sparse): random ancestor-closed addressed + true fingerprint.
      resetTemplateState();
      resetMainThreadState();
      takeOps();
      const addressed = randomAddressed(slots, rand);
      const holes = addressed.filter(() => rand() < 0.5);
      setPendingVaporAddressing({
        holes,
        addressed,
        slotCount: slots.length,
        tags: addressed.map((s) => slots[s]!.tag),
      });

      ShadowElement.nextUid = 2;
      const clone = proto.cloneNode(true) as ShadowElement;
      const ops = takeOps();
      const base = clone.uid;

      // Sparse actually engaged (not dense fallback).
      const reg2 = ops.indexOf(OP.REGISTER_TREE);
      expect(ops[reg2 + 3]).toEqual(addressed);

      applyOps(ops);

      const bg = collectBgBlockUids(clone, base);
      const mt = new Set<number>();
      for (let i = 0; i < addressed.length; i++) {
        if (elements.has(base + i)) mt.add(base + i);
      }

      // MT never materializes anchors; those uids exist only BG-side.
      const anchors = new Set<number>();
      for (let i = 0; i < addressed.length; i++) {
        const info = slots[addressed[i]!]!;
        if (info.tag === '#comment') anchors.add(base + i);
      }
      const bgMaterial = new Set([...bg].filter((u) => !anchors.has(u)));

      // Every MT-named uid must exist on the BG side…
      for (const u of mt) expect(bgMaterial.has(u)).toBe(true);
      // …and every BG element uid the MT can materialize is named there
      // (empty #text may be BG-only: allow bg ⊇ mt only for text anchors).
      for (const u of bgMaterial) {
        if (!mt.has(u)) {
          const idx = u - base;
          expect(slots[addressed[idx]!]!.tag).toBe('#text');
        }
      }
    });
  }
});
