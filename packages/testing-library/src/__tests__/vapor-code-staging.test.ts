/**
 * `+b:c` — vapor Code-Template (#337).
 *
 * With `templateStaging: 'code'`, the build parses each `template()` HTML
 * string, bakes a straight-line-PAPI `create()` into the MT bundle, and
 * instantiation crosses the wire as a single INSTANTIATE_TEMPLATE(id) —
 * no REGISTER_TREE, no CLONE_TREE, no MT interpretation. Naming stays
 * `uid = base + indexInAddressed` (the sparse-A2 contract), so the whole
 * update path is untouched.
 *
 * Proven here:
 *  - the compiled create() materializes the EXACT same MT tree (outerHTML
 *    oracle) and named-uid set as the data-path interpreter, for a corpus
 *    and for PRNG-fuzzed template × addressing combinations;
 *  - only INSTANTIATE_TEMPLATE crosses per clone (registration never does);
 *  - update path: SET_TEXT/SET_CLASS to named uids behave identically;
 *  - mutated hash → silent byte-identical fallback to the data path;
 *  - BG shadow uid allocation is identical in both paths.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  OP,
  hashVaporStructure,
  type TemplateNode,
  type VaporTreeAddressing,
} from 'vue-lynx/internal/ops';
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
  registerVaporTemplate,
  resetVaporTemplateRegistriesForTesting,
} from '../../../vue-lynx/main-thread/src/vapor-templates.js';
import {
  codegenVaporCreate,
  templateNodeFromHtml,
} from '../../../vue-lynx/plugin/src/compiler/vapor-template-node.js';
import { vaporCodeTemplateId } from '../../../vue-lynx/plugin/src/loaders/vapor-bundle-registrations.js';

const G = globalThis as Record<string, unknown>;

afterEach(() => {
  delete G['__VUE_LYNX_TEMPLATE_STAGING__'];
  resetTemplateState();
  resetMainThreadState();
  resetVaporTemplateRegistriesForTesting();
  takeOps();
  ShadowElement.nextUid = 2;
  vi.restoreAllMocks();
});

interface SlotInfo {
  tag: string;
  parent: number | null;
}

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

function metaFor(
  html: string,
  addressed: number[],
  hash?: string,
): VaporTreeAddressing {
  const built = templateNodeFromHtml(html, { autoPixelUnit: true })!;
  const slots = slotsFromStructure(built.structure);
  return {
    holes: addressed.filter((s) => s !== 0),
    addressed,
    slotCount: built.slotCount,
    tags: addressed.map((s) => slots[s]!.tag),
    hash: hash ?? built.hash,
  };
}

function cloneOnce(html: string, meta: VaporTreeAddressing): {
  ops: unknown[];
  root: ShadowElement;
} {
  resetTemplateState();
  takeOps();
  ShadowElement.nextUid = 2;
  const proto = parseTemplate(html).firstChild!;
  setPendingVaporAddressing(meta);
  const root = proto.cloneNode(true) as ShadowElement;
  setPendingVaporAddressing(undefined);
  return { ops: takeOps(), root };
}

/** Register the bundle-baked create() exactly as the MT loader would. */
function seedCodeTemplate(html: string, addressed: number[]): string {
  const built = templateNodeFromHtml(html, { autoPixelUnit: true })!;
  const { src, namedParents } = codegenVaporCreate(built.structure, addressed);
  // eslint-disable-next-line no-eval
  const create = (0, eval)(`(${src})`) as Parameters<
    typeof registerVaporTemplate
  >[2];
  const id = vaporCodeTemplateId(built.hash, addressed);
  registerVaporTemplate(id, namedParents, create);
  return id;
}

function namedMtSnapshot(base: number, count: number): Map<number, string> {
  const out = new Map<number, string>();
  for (let i = 0; i < count; i++) {
    const el = elements.get(base + i) as unknown as Element | undefined;
    if (el) out.set(i, el.outerHTML);
  }
  return out;
}

function bgUids(root: ShadowElement): number[] {
  const out: number[] = [];
  const walk = (n: ShadowElement): void => {
    if (!(n.tag === '#text' && n._textHost)) out.push(n.uid);
    let c = n.firstChild;
    while (c) {
      walk(c);
      c = c.next;
    }
  };
  walk(root);
  return out.sort((a, b) => a - b);
}

const HTML =
  '<view class=row><text class=col-id> </text><text class=col-label> </text><text class=col-remove>x</text></view>';
const ADDRESSED = [0, 1, 2, 3];

describe('vapor +b:c code staging (#337)', () => {
  it('instantiates via create() with output identical to the interpreter', () => {
    // Data-path oracle.
    const data = cloneOnce(HTML, metaFor(HTML, ADDRESSED));
    resetMainThreadState();
    applyOps(data.ops);
    const dataMt = namedMtSnapshot(data.root.uid, ADDRESSED.length);
    const dataRootHtml = (elements.get(data.root.uid) as unknown as Element)
      .outerHTML;
    expect(dataMt.size).toBeGreaterThan(0);

    // Code path.
    G['__VUE_LYNX_TEMPLATE_STAGING__'] = 'code';
    const id = seedCodeTemplate(HTML, ADDRESSED);
    const code = cloneOnce(HTML, metaFor(HTML, ADDRESSED));
    // Wire: one binding (string id crosses ONCE) + one bound
    // instantiation — the per-instance frame is CLONE_TREE-shaped.
    expect(code.ops).toEqual([
      OP.BIND_VAPOR_TEMPLATE, 1, id,
      OP.INSTANTIATE_BOUND_TEMPLATE, 1, code.root.uid,
    ]);

    resetMainThreadState();
    applyOps(code.ops);
    expect(namedMtSnapshot(code.root.uid, ADDRESSED.length)).toEqual(dataMt);
    // The FULL skeleton (anonymous statics included) matches, not just the
    // named handles.
    expect(
      (elements.get(code.root.uid) as unknown as Element).outerHTML,
    ).toBe(dataRootHtml);

    // BG uid allocation is unchanged (base + slot preorder over addressed).
    expect(bgUids(code.root)).toEqual(bgUids(data.root));

    // Update path zero-change: ordinary SET_* ops target the same uids.
    const base = code.root.uid;
    applyOps([
      OP.SET_TEXT, base + 1, 'id-42',
      OP.SET_CLASS, base + 2, 'col-label danger',
    ]);
    expect((elements.get(base + 1) as unknown as Element).textContent).toBe(
      'id-42',
    );
  });

  it('second clone crosses as one op — registration never rides the wire', () => {
    G['__VUE_LYNX_TEMPLATE_STAGING__'] = 'code';
    const id = seedCodeTemplate(HTML, ADDRESSED);

    resetTemplateState();
    takeOps();
    ShadowElement.nextUid = 2;
    const proto = parseTemplate(HTML).firstChild!;
    const meta = metaFor(HTML, ADDRESSED);
    setPendingVaporAddressing(meta);
    const first = proto.cloneNode(true) as ShadowElement;
    const second = proto.cloneNode(true) as ShadowElement;
    setPendingVaporAddressing(undefined);
    const ops = takeOps();
    expect(ops).toEqual([
      OP.BIND_VAPOR_TEMPLATE, 1, id,
      OP.INSTANTIATE_BOUND_TEMPLATE, 1, first.uid,
      OP.INSTANTIATE_BOUND_TEMPLATE, 1, second.uid,
    ]);
    applyOps(ops);
    expect(elements.has(first.uid)).toBe(true);
    expect(elements.has(second.uid)).toBe(true);
  });

  it('mutated hash: silent byte-identical fallback to the data path', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const baseline = cloneOnce(HTML, metaFor(HTML, ADDRESSED));

    G['__VUE_LYNX_TEMPLATE_STAGING__'] = 'code';
    seedCodeTemplate(HTML, ADDRESSED);
    const built = templateNodeFromHtml(HTML, { autoPixelUnit: true })!;
    const mutated = `${built.hash.slice(0, -1)}${built.hash.endsWith('0') ? '1' : '0'}`;
    const fallback = cloneOnce(HTML, metaFor(HTML, ADDRESSED, mutated));
    expect(JSON.stringify(fallback.ops)).toBe(JSON.stringify(baseline.ops));
    expect(fallback.ops[0]).toBe(OP.REGISTER_TREE);

    // The fallback renders end-to-end without the code registry.
    resetMainThreadState();
    resetVaporTemplateRegistriesForTesting();
    applyOps(fallback.ops);
    expect(elements.has(fallback.root.uid)).toBe(true);
  });

  it('invalid addressing metadata: dense data fallback (never mis-names)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Dense oracle: no metadata at all.
    resetTemplateState();
    takeOps();
    ShadowElement.nextUid = 2;
    const protoA = parseTemplate(HTML).firstChild!;
    setPendingVaporAddressing(undefined);
    protoA.cloneNode(true);
    const baseline = takeOps();

    G['__VUE_LYNX_TEMPLATE_STAGING__'] = 'code';
    seedCodeTemplate(HTML, ADDRESSED);
    const bad = metaFor(HTML, ADDRESSED);
    bad.tags = [...bad.tags].reverse(); // corrupt the tag fingerprint
    const run = cloneOnce(HTML, bad);
    expect(JSON.stringify(run.ops)).toBe(JSON.stringify(baseline));
  });
});

// ---------------------------------------------------------------------------
// PRNG fuzz: codegen create() ≡ sparse interpreter over random templates ×
// random ancestor-closed addressed sets.
// ---------------------------------------------------------------------------

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

const TAGS = ['view', 'text', 'image', 'scroll-view'];

function randomHtml(rand: () => number, depth = 0): string {
  const tag = TAGS[Math.floor(rand() * TAGS.length)]!;
  let out = `<${tag}`;
  if (rand() < 0.5) out += ` class=c${Math.floor(rand() * 8)}`;
  if (rand() < 0.2) out += ` style="width:${Math.floor(rand() * 20)};color:blue"`;
  if (rand() < 0.2) out += ` a=${Math.floor(rand() * 9)}`;
  out += '>';
  const childCount = depth >= 3 ? 0 : Math.floor(rand() * 4);
  if (childCount === 0 && rand() < 0.5) {
    out += rand() < 0.3 ? ' ' : `t${Math.floor(rand() * 50)}`;
  } else {
    for (let i = 0; i < childCount; i++) {
      const roll = rand();
      if (roll < 0.15) out += '<!>';
      else if (roll < 0.3) out += `s${Math.floor(rand() * 50)}`;
      else if (roll < 0.45) out += `<input v=${Math.floor(rand() * 9)}>`;
      else out += randomHtml(rand, depth + 1);
    }
  }
  return `${out}</${tag}>`;
}

function randomAddressed(slots: SlotInfo[], rand: () => number): number[] {
  const picked = new Set<number>([0]);
  for (let s = 1; s < slots.length; s++) {
    if (rand() < 0.35) picked.add(s);
  }
  for (const s of [...picked]) {
    let p = slots[s]!.parent;
    while (p !== null) {
      picked.add(p);
      p = slots[p]!.parent;
    }
  }
  return [...picked].sort((a, b) => a - b);
}

describe('fuzz: create() codegen ≡ sparse interpreter', () => {
  const RUNS = 30;
  for (let seed = 1; seed <= RUNS; seed++) {
    it(`seed ${seed}`, () => {
      const rand = mulberry32(seed * 104729);
      const html = randomHtml(mulberry32(seed * 7919));
      const built = templateNodeFromHtml(html, { autoPixelUnit: true });
      expect(built).not.toBeNull();
      const slots = slotsFromStructure(built!.structure);
      const addressed = randomAddressed(slots, rand);

      // Data-path oracle.
      resetTemplateState();
      resetMainThreadState();
      resetVaporTemplateRegistriesForTesting();
      takeOps();
      delete G['__VUE_LYNX_TEMPLATE_STAGING__'];
      const data = cloneOnce(html, metaFor(html, addressed));
      applyOps(data.ops);
      // Sparse actually engaged (not dense fallback) — REGISTER_TREE frame
      // carries the addressed list.
      expect(data.ops[0]).toBe(OP.REGISTER_TREE);
      expect(data.ops[3]).toEqual(addressed);
      const dataMt = namedMtSnapshot(data.root.uid, addressed.length);
      const dataRootHtml = (
        elements.get(data.root.uid) as unknown as Element
      ).outerHTML;

      // Code path.
      resetMainThreadState();
      resetVaporTemplateRegistriesForTesting();
      G['__VUE_LYNX_TEMPLATE_STAGING__'] = 'code';
      const id = seedCodeTemplate(html, addressed);
      const code = cloneOnce(html, metaFor(html, addressed));
      expect(code.ops).toEqual([
        OP.BIND_VAPOR_TEMPLATE, 1, id,
        OP.INSTANTIATE_BOUND_TEMPLATE, 1, code.root.uid,
      ]);
      applyOps(code.ops);
      expect(namedMtSnapshot(code.root.uid, addressed.length)).toEqual(dataMt);
      expect(
        (elements.get(code.root.uid) as unknown as Element).outerHTML,
      ).toBe(dataRootHtml);
      expect(bgUids(code.root)).toEqual(bgUids(data.root));
    });
  }
});
