/**
 * `+b!` — bundle-delivered data residual (#338).
 *
 * The structure AST is baked into the MT bundle; the BG sends only
 * REGISTER_TREE_BUNDLE(id, hash, addressed) after verifying its runtime
 * parse hashes identically to the build parse. Everything downstream
 * (CLONE_TREE, interpreters, update path) is unchanged.
 *
 * Hard requirements proven here:
 *  - flag OFF → ops byte-identical to today (zero regression), hash stamp
 *    or not;
 *  - flag ON + hash match → zero structure bytes cross the wire, MT output
 *    identical to the wire-delivered run;
 *  - mutated hash → SILENT byte-identical fallback to REGISTER_TREE;
 *  - dense kill-switch composes (addressedOr0 = 0 on the wire);
 *  - MT registry miss (mismatched bundles) → loud console.error, no crash.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { OP, type VaporTreeAddressing } from 'vue-lynx/internal/ops';
import {
  ShadowElement,
  resetTemplateState,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { parseTemplate } from '../../../vue-lynx/runtime/src/vapor/html-parser.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';
import {
  applyOps,
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';
import {
  registerVaporStructure,
  resetVaporTemplateRegistriesForTesting,
} from '../../../vue-lynx/main-thread/src/vapor-templates.js';
import { templateNodeFromHtml } from '../../../vue-lynx/plugin/src/compiler/vapor-template-node.js';

const G = globalThis as Record<string, unknown>;

const HTML =
  '<view class=row><text class=col-id> </text><text class=col-label> </text><text class=col-remove>x</text></view>';
// REGISTER_TREE preorder slots: 0=view, 1=text(id), 2=text(label), 3=text(x)
const META: Omit<VaporTreeAddressing, 'hash'> = {
  holes: [1, 2],
  addressed: [0, 1, 2, 3],
  slotCount: 4,
  tags: ['view', 'text', 'text', 'text'],
};

const BUILT = templateNodeFromHtml(HTML, { autoPixelUnit: true })!;

afterEach(() => {
  delete G['__VUE_LYNX_TEMPLATE_DELIVERY__'];
  delete G['__VUE_LYNX_SPARSE_NAMING__'];
  resetTemplateState();
  resetMainThreadState();
  resetVaporTemplateRegistriesForTesting();
  takeOps();
  ShadowElement.nextUid = 2;
  vi.restoreAllMocks();
});

/** One fresh template clone from HTML with the given addressing meta. */
function cloneOnce(meta: VaporTreeAddressing | undefined): {
  ops: unknown[];
  root: ShadowElement;
} {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
  const proto = parseTemplate(HTML).firstChild!;
  setPendingVaporAddressing(meta);
  const root = proto.cloneNode(true) as ShadowElement;
  setPendingVaporAddressing(undefined);
  return { ops: takeOps(), root };
}

/** Decode the flat ops buffer into frames for structural assertions. */
function frames(ops: unknown[]): unknown[][] {
  const ARITY: Record<number, number> = {
    [OP.REGISTER_TREE]: 3,
    [OP.REGISTER_TREE_BUNDLE]: 3,
    [OP.CLONE_TREE]: 2,
    [OP.INSTANTIATE_TEMPLATE]: 3,
    [OP.SET_TEXT]: 2,
    [OP.CREATE]: 2,
    [OP.CREATE_TEXT]: 1,
    [OP.INSERT]: 3,
    [OP.SET_CLASS]: 2,
    [OP.SET_PROP]: 3,
  };
  const out: unknown[][] = [];
  let i = 0;
  while (i < ops.length) {
    const code = ops[i] as number;
    const arity = ARITY[code];
    if (arity === undefined) throw new Error(`unexpected op ${code}`);
    out.push(ops.slice(i, i + arity + 1));
    i += arity + 1;
  }
  return out;
}

function mtSnapshot(): Map<number, string> {
  const out = new Map<number, string>();
  for (const [uid, el] of elements) {
    if (uid === 1) continue; // page root
    out.set(uid, (el as unknown as Element).outerHTML ?? String(el));
  }
  return out;
}

describe('vapor +b! bundle delivery (#338)', () => {
  it('zero regression: flag off → ops byte-identical, with or without hash stamp', () => {
    const baseline = cloneOnce({ ...META });
    const withHash = cloneOnce({ ...META, hash: BUILT.hash });
    expect(JSON.stringify(withHash.ops)).toBe(JSON.stringify(baseline.ops));
    expect(baseline.ops[0]).toBe(OP.REGISTER_TREE);
  });

  it('flag on + hash match: structure never crosses the wire; MT output identical', () => {
    // Oracle: wire-delivered run.
    const wire = cloneOnce({ ...META, hash: BUILT.hash });
    resetMainThreadState();
    applyOps(wire.ops);
    const wireMt = mtSnapshot();
    expect(wireMt.size).toBeGreaterThan(0);

    // Bundle-delivered run.
    G['__VUE_LYNX_TEMPLATE_DELIVERY__'] = 'bundle';
    const bundle = cloneOnce({ ...META, hash: BUILT.hash });
    const fs = frames(bundle.ops);
    const regFrames = fs.filter((f) => f[0] === OP.REGISTER_TREE);
    const bundleFrames = fs.filter((f) => f[0] === OP.REGISTER_TREE_BUNDLE);
    expect(regFrames).toHaveLength(0);
    expect(bundleFrames).toHaveLength(1);
    expect(bundleFrames[0]![2]).toBe(BUILT.hash);
    expect(bundleFrames[0]![3]).toEqual(META.addressed);
    // Wire-bytes assertion: zero structure bytes cross for known templates.
    const frameJson = JSON.stringify(bundleFrames[0]);
    expect(frameJson).not.toContain('"view"');
    expect(frameJson).not.toContain('"col-id"');
    const structureBytes = JSON.stringify(BUILT.structure).length;
    expect(frameJson.length).toBeLessThan(structureBytes);

    // MT: bundle-seeded registry reproduces the exact wire-path output.
    resetMainThreadState();
    registerVaporStructure(BUILT.hash, BUILT.structure);
    applyOps(bundle.ops);
    expect(mtSnapshot()).toEqual(wireMt);

    // Update path unchanged: SET_TEXT to a named hole applies identically.
    const base = bundle.root.uid;
    applyOps([OP.SET_TEXT, base + 1, 'hello']);
    const el = elements.get(base + 1) as unknown as Element;
    expect(el.textContent).toBe('hello');
  });

  it('mutated hash: silent byte-identical fallback to REGISTER_TREE', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const baseline = cloneOnce({ ...META, hash: BUILT.hash });

    G['__VUE_LYNX_TEMPLATE_DELIVERY__'] = 'bundle';
    const mutated = `${BUILT.hash.slice(0, -1)}${BUILT.hash.endsWith('0') ? '1' : '0'}`;
    const fallback = cloneOnce({ ...META, hash: mutated });
    expect(JSON.stringify(fallback.ops)).toBe(JSON.stringify(baseline.ops));
    expect(fallback.ops[0]).toBe(OP.REGISTER_TREE);

    // Fallback renders correctly with no bundle registry at all.
    resetMainThreadState();
    applyOps(fallback.ops);
    expect(elements.size).toBeGreaterThan(1);
    warn.mockRestore();
  });

  it('flag on without a stamped hash: wire path byte-identical', () => {
    const baseline = cloneOnce({ ...META });
    G['__VUE_LYNX_TEMPLATE_DELIVERY__'] = 'bundle';
    const noHash = cloneOnce({ ...META });
    expect(JSON.stringify(noHash.ops)).toBe(JSON.stringify(baseline.ops));
  });

  it('composes with the dense naming kill-switch (addressedOr0 = 0)', () => {
    // Dense wire oracle.
    G['__VUE_LYNX_SPARSE_NAMING__'] = false;
    const wire = cloneOnce({ ...META, hash: BUILT.hash });
    resetMainThreadState();
    applyOps(wire.ops);
    const wireMt = mtSnapshot();

    resetTemplateState();
    resetMainThreadState();
    G['__VUE_LYNX_TEMPLATE_DELIVERY__'] = 'bundle';
    const bundle = cloneOnce({ ...META, hash: BUILT.hash });
    const bundleFrame = frames(bundle.ops).find(
      (f) => f[0] === OP.REGISTER_TREE_BUNDLE,
    );
    expect(bundleFrame).toBeDefined();
    expect(bundleFrame![3]).toBe(0); // dense fallback preserved on the wire

    registerVaporStructure(BUILT.hash, BUILT.structure);
    applyOps(bundle.ops);
    expect(mtSnapshot()).toEqual(wireMt);
  });

  it('MT registry miss (mismatched bundles): loud error, no crash', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    G['__VUE_LYNX_TEMPLATE_DELIVERY__'] = 'bundle';
    const bundle = cloneOnce({ ...META, hash: BUILT.hash });
    resetMainThreadState();
    // No registerVaporStructure call — simulate a stale MT bundle.
    expect(() => applyOps(bundle.ops)).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('REGISTER_TREE_BUNDLE'),
    );
  });
});
