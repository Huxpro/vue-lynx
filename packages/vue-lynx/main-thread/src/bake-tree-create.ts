// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Bake a Vapor `TemplateNode` into a straight-line creator.
 *
 * This is the milestone-1 bridge toward Element-Template-shaped IFR paint
 * for Vapor (see docs/superpowers/specs/2026-07-20-vapor-ifr-element-templates-design.md):
 *
 *  - **Dense mode** (default, used by `CLONE_TREE` today): every materialized
 *    node is named `baseUid + preorderIndex`, matching the recursive
 *    `instantiateTemplate` walk so deterministic-replay hydration is
 *    unchanged. Comments / empty text still consume a uid slot without
 *    creating a native element.
 *  - **Sparse mode** (IFR-discard model): the native tree is still built in
 *    full, but only the root plus explicitly listed hole preorder indices
 *    are written into the elements map / returned. Static interior nodes are
 *    write-only handles held ephemerally for `__AppendElement` — the naming
 *    Vapor needs for pointer-stable updates is left to the Background dense
 *    path after IFR.
 *
 * Baking is a closure over a pre-flattened program (no `new Function` /
 * `eval`) so Lepus realms that reject dynamic codegen still benefit.
 */

import type { TemplateNode, TemplateNodeProps } from 'vue-lynx/internal/ops';

import { trackInsert } from './element-registry.js';

// ---------------------------------------------------------------------------
// Flat program
// ---------------------------------------------------------------------------

const enum Code {
  /** Consume a preorder uid; create nothing (comment / empty text). */
  Skip = 0,
  /** Create a typed element; push handle. */
  Create = 1,
  /** Create a text element; push handle. */
  CreateText = 2,
  /** Apply static props to the handle on top of the stack. */
  Props = 3,
  /** Append `childSlot` handle under `parentSlot` handle. */
  Append = 4,
}

type Prog = number[] & { _props?: TemplateNodeProps[] };

function createTyped(
  type: string,
  pageUniqueId: number,
): LynxElement {
  switch (type) {
    case 'view':
      return __CreateView(pageUniqueId);
    case 'text':
      return __CreateText(pageUniqueId);
    case 'image':
      return __CreateImage(pageUniqueId);
    case 'scroll-view':
      return __CreateScrollView(pageUniqueId);
    case 'div':
      return __CreateView(pageUniqueId);
    default:
      return __CreateElement(type, pageUniqueId);
  }
}

function isProps(p: TemplateNodeProps | 0): p is TemplateNodeProps {
  return p !== 0;
}

function applyProps(el: LynxElement, props: TemplateNodeProps): void {
  if (props.c !== undefined) __SetClasses(el, props.c);
  if (props.s !== undefined) __SetInlineStyles(el, props.s);
  if (props.a) {
    for (const [key, value] of props.a) __SetAttribute(el, key, value);
  }
  if (props.i !== undefined) __SetID(el, props.i);
  if (props.t !== undefined) __SetAttribute(el, 'text', props.t);
}

/**
 * Flatten `node` into a linear program. Returns the program plus the number
 * of preorder slots the walk consumes (including skips).
 */
export function flattenTemplate(
  node: TemplateNode,
): { prog: Prog; slotCount: number } {
  const prog: Prog = [];
  const propsTable: TemplateNodeProps[] = [];
  prog._props = propsTable;
  let slots = 0;

  const walk = (n: TemplateNode, parentSlot: number): void => {
    const [tag, props, children] = n;
    const slot = slots++;

    if (tag === '#comment') {
      prog.push(Code.Skip, slot);
      if (parentSlot >= 0) {
        // Skips are not appended — mirrors instantiateTemplate returning null.
      }
      return;
    }
    if (tag === '#text') {
      const text = isProps(props) ? props.t : undefined;
      if (text === undefined || text === '') {
        prog.push(Code.Skip, slot);
        return;
      }
      prog.push(Code.CreateText, slot);
      const pi = propsTable.length;
      propsTable.push(isProps(props) ? props : { t: text });
      prog.push(Code.Props, slot, pi);
      if (parentSlot >= 0) prog.push(Code.Append, parentSlot, slot);
      return;
    }

    prog.push(Code.Create, slot);
    // Tag table rides alongside the program (not on the wire).
    const tags = (prog as Prog & { _tags?: string[] })._tags
      ?? ((prog as Prog & { _tags?: string[] })._tags = []);
    tags.push(tag);
    prog.push(tags.length - 1);

    if (isProps(props)) {
      const pi = propsTable.length;
      propsTable.push(props);
      prog.push(Code.Props, slot, pi);
    }
    for (const child of children) walk(child, slot);
    if (parentSlot >= 0) prog.push(Code.Append, parentSlot, slot);
  };

  walk(node, -1);
  return { prog, slotCount: slots };
}

export interface BakeHooks {
  elements: Map<number, LynxElement>;
  installSelectorAttribute: (id: number, el: LynxElement) => void;
}

export type DenseTreeCreator = (
  pageUniqueId: number,
  baseUid: number,
  hooks: BakeHooks,
) => { el: LynxElement; uid: number } | null;

export type SparseTreeCreator = (
  pageUniqueId: number,
  hooks: BakeHooks,
) => {
  /** Native handles for [root, hole0, hole1, …] — ET-shaped return. */
  handles: LynxElement[];
  /** Preorder indices of those handles within the full walk. */
  namedSlots: number[];
};

/**
 * Dense creator used by `CLONE_TREE`: identical naming to the recursive
 * instantiate walk.
 */
export function bakeDenseTreeCreate(structure: TemplateNode): DenseTreeCreator {
  const { prog } = flattenTemplate(structure);
  const propsTable = prog._props!;
  const tags = (prog as Prog & { _tags?: string[] })._tags ?? [];

  return (pageUniqueId, baseUid, hooks) => {
    const { elements, installSelectorAttribute } = hooks;
    const stack: (LynxElement | null)[] = [];
    let root: { el: LynxElement; uid: number } | null = null;
    let i = 0;
    const len = prog.length;

    while (i < len) {
      const code = prog[i++]!;
      switch (code) {
        case Code.Skip: {
          const slot = prog[i++]!;
          stack[slot] = null;
          break;
        }
        case Code.Create: {
          const slot = prog[i++]!;
          const tagIdx = prog[i++]!;
          const uid = baseUid + slot;
          const el = createTyped(tags[tagIdx]!, pageUniqueId);
          __SetCSSId([el], 0);
          elements.set(uid, el);
          installSelectorAttribute(uid, el);
          stack[slot] = el;
          if (root === null) root = { el, uid };
          break;
        }
        case Code.CreateText: {
          const slot = prog[i++]!;
          const uid = baseUid + slot;
          const el = __CreateText(pageUniqueId);
          __SetCSSId([el], 0);
          elements.set(uid, el);
          installSelectorAttribute(uid, el);
          stack[slot] = el;
          if (root === null) root = { el, uid };
          break;
        }
        case Code.Props: {
          const slot = prog[i++]!;
          const pi = prog[i++]!;
          const el = stack[slot];
          if (el) applyProps(el, propsTable[pi]!);
          break;
        }
        case Code.Append: {
          const parentSlot = prog[i++]!;
          const childSlot = prog[i++]!;
          const parent = stack[parentSlot];
          const child = stack[childSlot];
          if (parent && child) {
            __AppendElement(parent, child);
            trackInsert(baseUid + parentSlot, baseUid + childSlot);
          }
          break;
        }
        default:
          break;
      }
    }
    return root;
  };
}

/**
 * Sparse creator for the IFR-discard model: builds the full native tree but
 * only names `holeSlots` (plus the root at slot 0). Returned `handles` are
 * `[root, …holes]` — the same shape as VDOM `INSTANTIATE_TEMPLATE`'s
 * `create()`. Callers that need later dense remapping should retain the
 * full `stack` themselves; this helper intentionally forgets unnamed
 * interiors after linking.
 */
export function bakeSparseTreeCreate(
  structure: TemplateNode,
  holeSlots: number[],
): SparseTreeCreator {
  const { prog, slotCount } = flattenTemplate(structure);
  const propsTable = prog._props!;
  const tags = (prog as Prog & { _tags?: string[] })._tags ?? [];
  const named = new Set<number>([0, ...holeSlots]);
  for (const s of holeSlots) {
    if (s < 0 || s >= slotCount) {
      throw new RangeError(
        `[vue-lynx] sparse bake: hole slot ${s} out of range 0..${
          slotCount - 1
        }`,
      );
    }
  }

  return (pageUniqueId, hooks) => {
    const { elements, installSelectorAttribute } = hooks;
    const stack: (LynxElement | null)[] = new Array(slotCount).fill(null);
    const namedSlots = [...named].sort((a, b) => a - b);
    // Temporary identity map so Append can find children before we forget
    // unnamed handles. uids here are slot indices (not protocol ids).
    let i = 0;
    const len = prog.length;

    while (i < len) {
      const code = prog[i++]!;
      switch (code) {
        case Code.Skip: {
          const slot = prog[i++]!;
          stack[slot] = null;
          break;
        }
        case Code.Create: {
          const slot = prog[i++]!;
          const tagIdx = prog[i++]!;
          const el = createTyped(tags[tagIdx]!, pageUniqueId);
          __SetCSSId([el], 0);
          stack[slot] = el;
          if (named.has(slot)) {
            // Sparse protocol ids are assigned by the caller (rootId+k);
            // here we only keep handles. Optional map seeding uses slot as
            // a private key only when the hooks map is the real elements
            // map — callers doing remapping pass a scratch map.
            elements.set(slot, el);
            installSelectorAttribute(slot, el);
          }
          break;
        }
        case Code.CreateText: {
          const slot = prog[i++]!;
          const el = __CreateText(pageUniqueId);
          __SetCSSId([el], 0);
          stack[slot] = el;
          if (named.has(slot)) {
            elements.set(slot, el);
            installSelectorAttribute(slot, el);
          }
          break;
        }
        case Code.Props: {
          const slot = prog[i++]!;
          const pi = prog[i++]!;
          const el = stack[slot];
          if (el) applyProps(el, propsTable[pi]!);
          break;
        }
        case Code.Append: {
          const parentSlot = prog[i++]!;
          const childSlot = prog[i++]!;
          const parent = stack[parentSlot];
          const child = stack[childSlot];
          if (parent && child) __AppendElement(parent, child);
          break;
        }
        default:
          break;
      }
    }

    const handles: LynxElement[] = [];
    for (const slot of namedSlots) {
      const el = stack[slot];
      if (el) handles.push(el);
    }
    return { handles, namedSlots };
  };
}
