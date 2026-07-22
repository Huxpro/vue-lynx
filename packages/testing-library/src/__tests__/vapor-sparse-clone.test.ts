/**
 * Sparse A2 vapor template clone (#298).
 *
 * Consumes `__vlxAddressing` (from #297) so REGISTER_TREE / CLONE_TREE name
 * only the addressed nav-slot closure — dense A1 remains the fallback when
 * metadata is absent or mismatched.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { OP, type VaporTreeAddressing } from 'vue-lynx/internal/ops';
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

/** Collect block uids on a sparse/dense BG clone (skip aliased-only #text). */
function collectBgNamedUids(root: ShadowElement): Map<number, string> {
  const out = new Map<number, string>();
  const walk = (n: ShadowElement): void => {
    // Aliased only-child #text is allocated outside the CLONE_TREE block.
    if (n.tag === '#text' && n._textHost) return;
    if (typeof n.uid === 'number' && n.uid >= 2) out.set(n.uid, n.tag);
    let c = n.firstChild;
    while (c) {
      walk(c);
      c = c.next;
    }
  };
  walk(root);
  return out;
}

/** Tags that never land in MT `elements` (BG-only anchors). */
function isMtMaterialized(tag: string): boolean {
  return tag !== '#comment';
}

function buildInertProto(): ShadowElement {
  // <view class=card>
  //   <text class=static>hi</text>   <!-- only-child text folded -->
  //   <text> </text>                 <!-- hole host, folded -->
  //   <image src=x.png />
  // </view>
  // REGISTER_TREE slots: 0=view, 1=static text, 2=hole text, 3=image
  const root = new ShadowElement('view');
  root._inert = true;
  root._baseClass = 'card';

  const staticText = new ShadowElement('text');
  staticText._inert = true;
  staticText._baseClass = 'static';
  const staticTxt = new ShadowElement('#text');
  staticTxt._inert = true;
  staticTxt._text = 'hi';
  staticText._link(staticTxt, null);

  const holeHost = new ShadowElement('text');
  holeHost._inert = true;
  const holeTxt = new ShadowElement('#text');
  holeTxt._inert = true;
  holeTxt._text = ' ';
  holeHost._link(holeTxt, null);

  const image = new ShadowElement('image');
  image._inert = true;
  image._attrs = new Map([['src', 'x.png']]);

  root._link(staticText, null);
  root._link(holeHost, null);
  root._link(image, null);
  return root;
}

describe('sparse A2 cloneTemplatePrototype', () => {
  it('emits REGISTER_TREE with addressed list and allocates sparse uids', () => {
    const proto = buildInertProto();
    // Proto construction consumed uids — reset so the clone block starts at 2.
    ShadowElement.nextUid = 2;
    takeOps();

    setPendingVaporAddressing({
      holes: [2],
      addressed: [0, 1, 2], // prefix sibling 1 kept for _nthChild/_next
      slotCount: 4,
      tags: ['view', 'text', 'text'],
    });

    const clone = proto.cloneNode(true) as ShadowElement;
    const ops = takeOps();
    const base = clone.uid;

    expect(base).toBe(2);
    // Sparse reserves 3 addressed uids; each folded only-child #text alias
    // then allocates one more via the plain constructor (outside the block).
    expect(ShadowElement.nextUid).toBe(base + 3 + 2);

    // Root linked children: static + hole (image skipped — not addressed)
    expect(clone.firstChild).toBeTruthy();
    expect(clone.firstChild!.next).toBeTruthy();
    expect(clone.firstChild!.next!.next).toBeNull();
    expect(clone.firstChild!.uid).toBe(base + 1);
    expect(clone.firstChild!.next!.uid).toBe(base + 2);

    // REGISTER_TREE carries addressed list
    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(regIdx).toBeGreaterThanOrEqual(0);
    expect(ops[regIdx + 3]).toEqual([0, 1, 2]);

    const cloneIdx = ops.indexOf(OP.CLONE_TREE);
    expect(ops[cloneIdx + 2]).toBe(base);
  });

  it('falls back to dense naming without addressing metadata', () => {
    const proto = buildInertProto();
    ShadowElement.nextUid = 2;
    takeOps();
    setPendingVaporAddressing(undefined);

    const clone = proto.cloneNode(true) as ShadowElement;
    const ops = takeOps();
    const base = clone.uid;

    expect(base).toBe(2);
    // Dense: 4 structure slots + 2 aliased only-child #text shadows
    expect(ShadowElement.nextUid).toBe(base + 4 + 2);
    // All three element children linked
    expect(clone.firstChild!.next!.next).toBeTruthy();

    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(ops[regIdx + 3]).toBe(0); // dense sentinel
  });

  it('falls back to dense when slotCount mismatches the built structure', () => {
    const proto = buildInertProto();
    ShadowElement.nextUid = 2;
    takeOps();
    setPendingVaporAddressing({
      holes: [2],
      addressed: [0, 2],
      slotCount: 99, // wrong
      tags: ['view', 'text'],
    });

    proto.cloneNode(true);
    const ops = takeOps();
    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(ops[regIdx + 3]).toBe(0);
  });

  it('falls back to dense when tag fingerprints disagree (same-count skew)', () => {
    const proto = buildInertProto();
    ShadowElement.nextUid = 2;
    takeOps();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setPendingVaporAddressing({
      holes: [2],
      addressed: [0, 1, 2],
      slotCount: 4, // count matches…
      tags: ['view', 'image', 'text'], // …but tags are shifted
    });

    proto.cloneNode(true);
    const ops = takeOps();
    expect(ops[ops.indexOf(OP.REGISTER_TREE) + 3]).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('threads pending addressing into the first cache build only', () => {
    const proto = buildInertProto();
    ShadowElement.nextUid = 2;
    takeOps();

    setPendingVaporAddressing({
      holes: [0],
      addressed: [0],
      slotCount: 4,
      tags: ['view'],
    });
    const first = proto.cloneNode(true) as ShadowElement;
    takeOps();

    // Second clone must reuse sparse cache even if pending is cleared.
    setPendingVaporAddressing(undefined);
    ShadowElement.nextUid = 100;
    const second = proto.cloneNode(true) as ShadowElement;
    const ops = takeOps();

    expect(first.uid).toBe(2);
    expect(second.uid).toBe(100);
    // Sparse root-only: only root linked → +1
    expect(ShadowElement.nextUid).toBe(101);
    expect(ops[ops.indexOf(OP.CLONE_TREE) + 2]).toBe(100);
    // No second REGISTER_TREE
    expect(ops.filter((x) => x === OP.REGISTER_TREE)).toHaveLength(0);
  });
});

describe('BG↔MT named-uid parity (review ③)', () => {
  type Shape = {
    name: string;
    build: () => ShadowElement;
    meta: VaporTreeAddressing;
  };

  function foldedText(tag: string, cls: string, text: string): ShadowElement {
    const el = new ShadowElement(tag);
    el._inert = true;
    el._baseClass = cls;
    const tx = new ShadowElement('#text');
    tx._inert = true;
    tx._text = text;
    el._link(tx, null);
    return el;
  }

  const shapes: Shape[] = [
    {
      name: 'card root+hole',
      build: buildInertProto,
      meta: {
        holes: [2],
        addressed: [0, 2],
        slotCount: 4,
        tags: ['view', 'text'],
      },
    },
    {
      name: 'root-only static',
      build: () => {
        const root = new ShadowElement('view');
        root._inert = true;
        root._baseClass = 'only';
        root._link(foldedText('text', 's', 'x'), null);
        const img = new ShadowElement('image');
        img._inert = true;
        img._attrs = new Map([['src', 'y']]);
        root._link(img, null);
        return root;
      },
      meta: {
        holes: [],
        addressed: [0],
        slotCount: 3,
        tags: ['view'],
      },
    },
    {
      name: 'comment sibling between texts',
      build: () => {
        const root = new ShadowElement('view');
        root._inert = true;
        root._link(foldedText('text', 'a', 'a'), null);
        const c = new ShadowElement('#comment');
        c._inert = true;
        root._link(c, null);
        root._link(foldedText('text', 'b', 'b'), null);
        return root;
      },
      meta: {
        holes: [1, 3],
        addressed: [0, 1, 2, 3],
        slotCount: 4,
        tags: ['view', 'text', '#comment', 'text'],
      },
    },
    {
      name: 'prefix siblings before hole',
      build: () => {
        const root = new ShadowElement('view');
        root._inert = true;
        root._link(foldedText('text', 'a', 'a'), null);
        root._link(foldedText('text', 'b', 'b'), null);
        root._link(foldedText('text', 'h', ' '), null);
        return root;
      },
      meta: {
        holes: [3],
        addressed: [0, 1, 2, 3],
        slotCount: 4,
        tags: ['view', 'text', 'text', 'text'],
      },
    },
  ];

  for (const shape of shapes) {
    it(`${shape.name}: materializable BG uids === MT elements.set`, () => {
      resetTemplateState();
      resetMainThreadState();
      takeOps();
      ShadowElement.nextUid = 2;

      const proto = shape.build();
      ShadowElement.nextUid = 2;
      takeOps();
      setPendingVaporAddressing(shape.meta);

      const clone = proto.cloneNode(true) as ShadowElement;
      const ops = takeOps();
      const reg = ops.indexOf(OP.REGISTER_TREE);
      expect(reg).toBeGreaterThanOrEqual(0);
      expect(ops[reg + 3]).toEqual(
        [...shape.meta.addressed].sort((a, b) => a - b),
      );

      applyOps(ops);

      const bg = collectBgNamedUids(clone);
      const base = clone.uid;
      const mtNamed = new Set<number>();
      for (let u = base; u < base + shape.meta.addressed.length; u++) {
        if (elements.has(u)) mtNamed.add(u);
      }

      const bgMaterial = new Set<number>();
      for (const [uid, tag] of bg) {
        if (isMtMaterialized(tag)) bgMaterial.add(uid);
      }

      expect(mtNamed).toEqual(bgMaterial);
    });
  }

  it('comment-anchor insert: unnamed MT comment does not break INSERT order', () => {
    // view > hole-text / #comment / static-text — sparse names [0,1,3]
    resetTemplateState();
    resetMainThreadState();
    takeOps();
    ShadowElement.nextUid = 2;

    const root = new ShadowElement('view');
    root._inert = true;
    root._link(foldedText('text', 'hole', ' '), null);
    const c = new ShadowElement('#comment');
    c._inert = true;
    root._link(c, null);
    root._link(foldedText('text', 'static', 'tail'), null);

    setPendingVaporAddressing({
      holes: [1],
      addressed: [0, 1, 3],
      slotCount: 4,
      tags: ['view', 'text', 'text'],
    });

    const clone = root.cloneNode(true) as ShadowElement;
    const ops = takeOps();
    applyOps(ops);

    const base = clone.uid;
    // sparse: 0→root, 1→hole, 2→static (comment addressed? no — not in list)
    const staticUid = base + 2;
    expect(elements.has(staticUid)).toBe(true);

    const childUid = 5000;
    applyOps([
      OP.CREATE, childUid, 'view',
      OP.SET_CLASS, childUid, 'dynamic',
      OP.INSERT, base, childUid, staticUid,
    ]);

    const rootEl = elements.get(base) as Element;
    const classes = [...rootEl.childNodes].map(
      (n) => (n as Element).getAttribute?.('class'),
    );
    expect(classes).toEqual(['hole', 'dynamic', 'static']);
  });
});
