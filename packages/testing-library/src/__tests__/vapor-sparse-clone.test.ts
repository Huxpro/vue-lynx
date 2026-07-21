/**
 * Sparse A2 vapor template clone (#298).
 *
 * Consumes `__vlxAddressing` (from #297) so REGISTER_TREE / CLONE_TREE name
 * only the addressed nav-slot closure — dense A1 remains the fallback when
 * metadata is absent or mismatched.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';

afterEach(() => {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
});

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
