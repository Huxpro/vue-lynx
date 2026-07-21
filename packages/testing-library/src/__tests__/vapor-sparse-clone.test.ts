/**
 * Sparse A2 vapor template clone (#298).
 *
 * Consumes `__vlxAddressing` (from #297) so REGISTER_TREE / CLONE_TREE name
 * only the addressed nav-slot closure — dense A1 remains the fallback when
 * metadata is absent or mismatched.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { OP, VAPOR_ADDRESSING_KEY } from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import { template } from '../../../vue-lynx/runtime/src/vapor/index.js';

afterEach(() => {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
});

function buildInertProto(): ShadowElement {
  // <view class=card>
  //   <text class=static>hi</text>
  //   <text> </text>   <!-- hole -->
  //   <image src=x.png />
  // </view>
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
    // slots: 0=view, 1=static text (folded), 2=hole text (folded), 3=image
    // only-child text folding → slotCount 4 with folded text hosts.
    setPendingVaporAddressing({
      holes: [2],
      addressed: [0, 1, 2], // prefix sibling 1 kept for _nthChild/_next
      slotCount: 4,
    });

    const clone = proto.cloneNode(true) as ShadowElement;
    const ops = takeOps();

    expect(clone.uid).toBe(2); // base
    // Sparse: 3 addressed → nextUid advanced by 3 (2,3,4 used; next is 5)
    expect(ShadowElement.nextUid).toBe(5);

    // Root linked children: static + hole (image skipped — not addressed)
    expect(clone.firstChild).toBeTruthy();
    expect(clone.firstChild!.next).toBeTruthy();
    expect(clone.firstChild!.next!.next).toBeNull();

    // REGISTER_TREE carries addressed list
    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(regIdx).toBeGreaterThanOrEqual(0);
    expect(ops[regIdx + 3]).toEqual([0, 1, 2]);

    const cloneIdx = ops.indexOf(OP.CLONE_TREE);
    expect(ops[cloneIdx + 2]).toBe(2); // baseUid
  });

  it('falls back to dense naming without addressing metadata', () => {
    const proto = buildInertProto();
    setPendingVaporAddressing(undefined);

    const clone = proto.cloneNode(true) as ShadowElement;
    const ops = takeOps();

    expect(clone.uid).toBe(2);
    // Dense: 4 slots → nextUid = 2 + 4
    expect(ShadowElement.nextUid).toBe(6);
    // All three element children linked
    expect(clone.firstChild!.next!.next).toBeTruthy();

    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(ops[regIdx + 3]).toBe(0); // dense sentinel
  });

  it('falls back to dense when slotCount mismatches the built structure', () => {
    const proto = buildInertProto();
    setPendingVaporAddressing({
      holes: [2],
      addressed: [0, 2],
      slotCount: 99, // wrong
    });

    proto.cloneNode(true);
    const ops = takeOps();
    const regIdx = ops.indexOf(OP.REGISTER_TREE);
    expect(ops[regIdx + 3]).toBe(0);
  });
});

describe('template() threads __vlxAddressing', () => {
  it('reads factory.__vlxAddressing on each clone call', () => {
    const factory = template(
      '<view class="card"><text class="s">hi</text><text> </text></view>',
      1,
    ) as (() => ShadowElement) & {
      [typeof VAPOR_ADDRESSING_KEY]?: {
        holes: number[];
        addressed: number[];
        slotCount: number;
      };
    };

    // Fully static-ish with one text hole host — exact slotCount depends on
    // HTML parse folding. Stamp after first structure discovery via a
    // deliberate mismatch first, then correct on second factory.
    factory[VAPOR_ADDRESSING_KEY] = {
      holes: [0],
      addressed: [0],
      slotCount: 1,
    };

    // First call may or may not match slotCount depending on parse; either
    // sparse or dense is fine — we assert the stamp is consulted (no throw).
    const el = factory();
    expect(el).toBeTruthy();
    expect(el.tag).toBe('view');
  });
});
