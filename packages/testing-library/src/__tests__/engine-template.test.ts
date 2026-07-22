/**
 * Engine-Template (M3b, #323) — axis-A staging `engine`.
 *
 * The MT executor routes REGISTER_TREE/CLONE_TREE through the native
 * `__CreateElementTemplate` family when probed available, and falls back to
 * data interpretation (reported stub) otherwise. A mock engine family
 * (backed by the real PAPI so the resulting tree is genuinely painted)
 * verifies that the engine path produces the same named-uid bookkeeping as
 * the interpreter — every later SET / INSERT op must work unchanged.
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
  buildEngineTemplateDescriptor,
  getEngineTemplateStatus,
  probeEngineTemplates,
  resetEngineTemplatesForTesting,
} from '../../../vue-lynx/main-thread/src/engine-template.js';

const g = globalThis as Record<string, unknown>;

// <view class=card> <text>hi</text> <!----> <text></text> <image src=x> </view>
// slots: 0=view 1=text(folded "hi") 2=#comment 3=#text(empty anchor) 4=image
const STRUCTURE: TemplateNode = [
  'view',
  { c: 'card' },
  [
    ['text', { t: 'hi' }, []],
    ['#comment', 0, []],
    ['#text', 0, []],
    ['image', { a: [['src', 'x.png']] }, []],
  ],
];

/**
 * Mock engine family over the real PAPI: build() records a prototype
 * (plain JS nodes tagged with their preorder slot), instantiate() replays
 * it through __CreateElement/__SetAttribute/__AppendElement — a genuine
 * native clone whose named handles are returned by structure slot.
 */
interface MockProtoNode {
  tag: string;
  slot: number;
  attrs: [string, unknown][];
  children: MockProtoNode[];
}

function installMockEngineFamily(log: string[]): void {
  g['__CreateElementTemplate'] = (tag: string, slot: number): MockProtoNode => {
    log.push(`create:${tag}@${slot}`);
    return { tag, slot, attrs: [], children: [] };
  };
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
    log.push(`instantiate:[${namedSlots.join(',')}]`);
    const bySlot = new Map<number, unknown>();
    const build = (proto: MockProtoNode): unknown => {
      const el =
        proto.tag === 'text' || proto.tag === '#text'
          ? (g['__CreateText'] as (p: number) => unknown)(pageUniqueId)
          : (g['__CreateElement'] as (t: string, p: number) => unknown)(
              proto.tag,
              pageUniqueId,
            );
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

beforeEach(() => {
  (globalThis as any).lynxTestingEnv.switchToMainThread();
  resetMainThreadState();
  g['__VUE_LYNX_TEMPLATE_STAGING__'] = 'engine';
});

afterEach(() => {
  uninstallMockEngineFamily();
  delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
  resetMainThreadState();
});

describe('engine probe honesty', () => {
  it('reports stub when the PAPI family is absent and interprets instead', () => {
    const base = 100;
    applyOps([
      OP.REGISTER_TREE, 7, STRUCTURE, [0, 1, 4],
      OP.CLONE_TREE, 7, base,
    ]);
    // Fallback interpreter still named the addressed slots…
    expect(elements.has(base)).toBe(true);
    expect(elements.has(base + 1)).toBe(true);
    expect(elements.has(base + 2)).toBe(true);
    // …and the cell is explicitly marked stub for benchmark honesty.
    expect(getEngineTemplateStatus()).toBe('stub');
    expect(g[ENGINE_ET_STATUS_GLOBAL]).toBe('stub');
  });

  it('does not engage at all when staging is not engine', () => {
    delete g['__VUE_LYNX_TEMPLATE_STAGING__'];
    const log: string[] = [];
    installMockEngineFamily(log);
    applyOps([
      OP.REGISTER_TREE, 7, STRUCTURE, [0, 1],
      OP.CLONE_TREE, 7, 100,
    ]);
    expect(log).toEqual([]); // untouched — zero-regression default
    expect(getEngineTemplateStatus()).toBe('unprobed');
  });
});

describe('engine instantiation (mock family over real PAPI)', () => {
  it('sparse: names uid = base + indexInAddressed, tree painted natively', () => {
    const log: string[] = [];
    installMockEngineFamily(log);

    const base = 200;
    const addressed = [0, 1, 2, 4]; // includes the #comment anchor at 2
    applyOps([
      OP.REGISTER_TREE, 9, STRUCTURE, addressed,
      OP.CLONE_TREE, 9, base,
    ]);

    expect(probeEngineTemplates()).toBe('native');
    // Prototype built once via the template family (anchors skipped).
    expect(log.filter((l) => l.startsWith('create:'))).toEqual([
      'create:view@0',
      'create:text@1',
      'create:image@4',
    ]);
    // Named handles requested only for materializable addressed slots.
    expect(log).toContain('instantiate:[0,1,4]');

    // uid contract identical to the interpreter: base + indexInAddressed.
    expect(elements.has(base + 0)).toBe(true); // view (slot 0)
    expect(elements.has(base + 1)).toBe(true); // text (slot 1)
    expect(elements.has(base + 2)).toBe(false); // #comment — BG-only anchor
    expect(elements.has(base + 3)).toBe(true); // image (slot 4 → index 3)

    // Later ops target engine-created elements like ordinary ones.
    applyOps([OP.SET_CLASS, base + 3, 'patched']);
    const img = elements.get(base + 3) as unknown as Element;
    expect(img.getAttribute('class')).toBe('patched');

    // The clone is a real subtree: view has text + image natively appended.
    const root = elements.get(base) as unknown as Element;
    expect(root.getAttribute('class')).toBe('card');
    expect(root.childNodes.length).toBe(2);
  });

  it('dense: names every preorder slot except anchors', () => {
    const log: string[] = [];
    installMockEngineFamily(log);
    const base = 300;
    applyOps([
      OP.REGISTER_TREE, 11, STRUCTURE, 0, // dense sentinel
      OP.CLONE_TREE, 11, base,
    ]);
    expect(elements.has(base + 0)).toBe(true); // view
    expect(elements.has(base + 1)).toBe(true); // text
    expect(elements.has(base + 2)).toBe(false); // comment anchor
    expect(elements.has(base + 3)).toBe(false); // empty-text anchor
    expect(elements.has(base + 4)).toBe(true); // image
  });

  it('falls back to interpretation and stubs when instantiate throws', () => {
    const log: string[] = [];
    installMockEngineFamily(log);
    g['__InstantiateElementTemplate'] = () => {
      throw new Error('engine says no');
    };

    const base = 400;
    applyOps([
      OP.REGISTER_TREE, 13, STRUCTURE, [0, 1],
      OP.CLONE_TREE, 13, base,
    ]);
    // Fail-safe: interpreter painted the tree anyway…
    expect(elements.has(base)).toBe(true);
    expect(elements.has(base + 1)).toBe(true);
    // …and the status downgraded to stub.
    expect(getEngineTemplateStatus()).toBe('stub');
  });
});

describe('shared descriptor (VDOM/Vapor reuse)', () => {
  it('splits holes into attr vs element slots for both provenances', () => {
    // Vapor shape: named = recovered addressed closure, holes ⊆ named.
    const vapor = buildEngineTemplateDescriptor(
      STRUCTURE,
      [0, 1, 4],
      [1, 4],
    );
    expect(vapor.namedSlots).toEqual([0, 1, 4]);
    expect(vapor.attrSlots).toEqual([1, 4]);
    expect(vapor.elementSlots).toEqual([]);

    // VDOM shape: named = root + intrinsic holes, one marked as #slot host.
    const vdom = buildEngineTemplateDescriptor(
      STRUCTURE,
      [0, 1, 4],
      [1, 4],
      [4],
    );
    expect(vdom.attrSlots).toEqual([1]);
    expect(vdom.elementSlots).toEqual([4]);
  });
});
