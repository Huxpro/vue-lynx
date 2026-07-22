// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main Thread ops executor.
 *
 * Receives the flat-array ops buffer sent by the Background Thread via
 * callLepusMethod('vuePatchUpdate', { data: JSON.stringify(ops) }) and applies
 * each operation using Lynx PAPI.
 */

import { OP, OP_ARITY } from 'vue-lynx/internal/ops';
import type { TemplateNode } from 'vue-lynx/internal/ops';

import {
  elements,
  pageUniqueId,
  releaseSubtree,
  resetElementRegistry,
  setPageUniqueId,
  trackInsert,
} from './element-registry.js';
import {
  buildEngineTemplateDescriptor,
  instantiateEngineTemplate,
  registerEngineTemplate,
  resetEngineTemplatesForTesting,
} from './engine-template.js';
import { getTemplate, bindTemplateInstanceSlots, getTemplateSlotParent, resetTemplateInstanceSlots, unbindTemplateInstanceSlots } from './element-templates.js';
import {
  createListElement,
  flushListUpdates,
  insertListItem,
  isListParent,
  isPlatformInfoAttr,
  resetListState,
  setPlatformInfoProp,
} from './list-apply.js';
import {
  applyInitMtRef,
  applySetMtRef,
  applySetWorkletEvent,
  resetWorkletState,
} from './worklet-apply.js';

/**
 * Use typed PAPI creators for known element types.
 * Native Lynx may set up type-specific internals (e.g. overflow clipping
 * for View, hardware-accelerated decoding for Image) via the typed functions
 * that the generic __CreateElement does not.
 *
 * @param parentComponentUniqueId - The PAPI unique ID of the page root.
 *   `__SetCSSId` sets `css_style_sheet_manager_` directly on each element,
 *   so CSS rendering works without a ComponentElement ancestor.
 */
function createTypedElement(
  type: string,
  parentComponentUniqueId: number,
): LynxElement {
  switch (type) {
    case 'view':
      return __CreateView(parentComponentUniqueId);
    case 'text':
      return __CreateText(parentComponentUniqueId);
    case 'image':
      return __CreateImage(parentComponentUniqueId);
    case 'scroll-view':
      return __CreateScrollView(parentComponentUniqueId);
    case 'div':
      // KeepAlive's internal storage container — map to view (Lynx equivalent).
      return __CreateView(parentComponentUniqueId);
    default:
      return __CreateElement(type, parentComponentUniqueId);
  }
}

// ---------------------------------------------------------------------------
// Template instantiation (Vapor fast path)
// ---------------------------------------------------------------------------

interface RegisteredTree {
  structure: TemplateNode;
  /** Sparse A2 naming list; undefined → dense A1. */
  addressed?: number[];
}

const templates = new Map<number, RegisteredTree>();

/**
 * Axis-A staging request for template instantiation (#321/#323).
 * `'engine'` routes REGISTER_TREE/CLONE_TREE through the native
 * Engine-Template family when the engine provides it. Read from the
 * build-time define when present (typeof-guarded for test realms), else
 * from a same-named global so harnesses can flip it per run.
 */
function engineStagingRequested(): boolean {
  const staging = typeof __VUE_LYNX_TEMPLATE_STAGING__ !== 'undefined'
    ? __VUE_LYNX_TEMPLATE_STAGING__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_TEMPLATE_STAGING__'];
  if (staging === 'engine') return true;
  // Axis-D ephemeral paint may independently request engine routing for the
  // IFR first frame (`ifrPaint: 'engine-et'`).
  const paint = typeof __VUE_LYNX_IFR_PAINT__ !== 'undefined'
    ? __VUE_LYNX_IFR_PAINT__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_PAINT__'];
  return paint === 'engine-et'
    && (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_MT__'] === true;
}

const ARITY = OP_ARITY as Readonly<Record<number, number | undefined>>;

// NodesRef selector attributes are only consumed by the Background Thread.
// IFR can paint without them, then install them immediately before BG adopts
// the tree. Keeping this state here makes CREATE and CLONE_TREE follow the
// same protocol and keeps normal/non-IFR applyOps behavior unchanged.
let deferIfrSelectorAttributes = false;
let deferredIfrSelectorIds: number[] = [];

function installSelectorAttribute(id: number, el: LynxElement): void {
  if (deferIfrSelectorAttributes) {
    deferredIfrSelectorIds.push(id);
    return;
  }
  __SetAttribute(el, `vue-ref-${id}`, 1);
}

/** Start one IFR first-frame window in which NodesRef selectors are deferred. */
export function beginIfrSelectorAttributeDeferral(): void {
  deferIfrSelectorAttributes = true;
  deferredIfrSelectorIds = [];
}

/** Install every deferred selector before the Background Thread owns the tree. */
export function commitIfrSelectorAttributes(): void {
  const ids = deferredIfrSelectorIds;
  deferredIfrSelectorIds = [];
  deferIfrSelectorAttributes = false;

  let installed = false;
  for (const id of ids) {
    const el = elements.get(id);
    if (el) {
      __SetAttribute(el, `vue-ref-${id}`, 1);
      installed = true;
    }
  }
  if (installed) __FlushElementTree();
}

/** Discard deferred MT selectors before teardown or normal BG replay. */
export function clearIfrSelectorAttributeDeferral(): void {
  deferIfrSelectorAttributes = false;
  deferredIfrSelectorIds = [];
}

/**
 * Detect a duplicate initial render even when value/ref frames precede its
 * first allocator. Vapor can emit INIT_MT_REF or SET_TEXT before registering
 * and cloning a template, so checking only ops[0] misses real duplicates.
 */
function hasDuplicateFirstAllocator(ops: unknown[]): boolean {
  let cursor = 0;
  while (cursor < ops.length) {
    const code = ops[cursor] as number;
    const arity = ARITY[code];
    if (arity === undefined || cursor + arity >= ops.length) return false;

    if (
      code === OP.CREATE
      || code === OP.CREATE_TEXT
      || code === OP.INSTANTIATE_TEMPLATE
    ) {
      return elements.has(ops[cursor + 1] as number);
    }
    if (code === OP.REGISTER_TREE) {
      return templates.has(ops[cursor + 1] as number);
    }
    if (code === OP.CLONE_TREE) {
      return elements.has(ops[cursor + 2] as number);
    }

    cursor += arity + 1;
  }
  return false;
}

function applyStaticProps(el: LynxElement, props: TemplateNode[1]): void {
  if (!props) return;
  if (props.c !== undefined) __SetClasses(el, props.c);
  if (props.s !== undefined) __SetInlineStyles(el, props.s);
  if (props.a) {
    for (const [key, value] of props.a) __SetAttribute(el, key, value);
  }
  if (props.i !== undefined) __SetID(el, props.i);
  if (props.t !== undefined) {
    __SetAttribute(el, 'text', props.t);
  }
}

/**
 * **Named Tree** interpreter (legacy "dense A1") — four-axis coordinate
 * Data / Dense / — / Split (see vue-lynx/internal/matrix): the residual
 * arrives as a lazy AST and this generic walk materializes it, naming
 * every preorder slot.
 *
 * Element ids are assigned by pre-order traversal starting at baseUid —
 * the exact allocation order the BG thread used for its shadow clone, so
 * both sides agree without a transmitted map.
 *
 * Comment nodes and empty #text nodes are Background Thread anchors: the
 * walk consumes their uid (keeping both sides' pre-order counters in
 * lockstep) but creates no Main Thread element — returns null.
 */
function instantiateTemplateDense(
  node: TemplateNode,
  base: number,
  counter: { value: number },
): { el: LynxElement; uid: number } | null {
  const uid = base + counter.value++;
  const [tag, props, children] = node;

  if (tag === '#comment') return null;
  if (tag === '#text' && (!props || props.t === undefined || props.t === '')) {
    return null;
  }

  let el: LynxElement;
  if (tag === '#text') {
    el = __CreateText(pageUniqueId);
  } else {
    el = createTypedElement(tag, pageUniqueId);
  }
  __SetCSSId([el], 0);
  elements.set(uid, el);
  installSelectorAttribute(uid, el);
  applyStaticProps(el, props);

  for (const childNode of children) {
    const child = instantiateTemplateDense(childNode, base, counter);
    if (child) {
      __AppendElement(el, child.el);
      trackInsert(uid, child.uid);
    }
  }
  return { el, uid };
}

/**
 * **recovered Data-Template** interpreter (legacy "sparse A2") — four-axis
 * coordinate Data / Sparse / recovered / Split: same lazy-AST residual and
 * generic interpreter as the Named Tree, but only the compiler-recovered
 * addressed closure receives identities (uid = base + indexInAddressed).
 * Anonymous static nodes are write-only handles for `__AppendElement` —
 * the full native skeleton is still built (why sparse alone is not an FCP
 * win; Engine staging removes the per-node JS walk itself).
 */
function instantiateTemplateSparse(
  node: TemplateNode,
  base: number,
  counter: { value: number },
  slotToSparse: Map<number, number>,
  parentUid: number | null,
): { el: LynxElement; uid: number | null } | null {
  const slot = counter.value++;
  const [tag, props, children] = node;

  if (tag === '#comment') return null;
  if (tag === '#text' && (!props || props.t === undefined || props.t === '')) {
    return null;
  }

  let el: LynxElement;
  if (tag === '#text') {
    el = __CreateText(pageUniqueId);
  } else {
    el = createTypedElement(tag, pageUniqueId);
  }
  __SetCSSId([el], 0);
  applyStaticProps(el, props);

  const sparseIdx = slotToSparse.get(slot);
  const uid = sparseIdx !== undefined ? base + sparseIdx : null;
  if (uid !== null) {
    elements.set(uid, el);
    installSelectorAttribute(uid, el);
    if (parentUid !== null) trackInsert(parentUid, uid);
  }

  for (const childNode of children) {
    const child = instantiateTemplateSparse(
      childNode,
      base,
      counter,
      slotToSparse,
      uid,
    );
    if (child) {
      __AppendElement(el, child.el);
    }
  }
  return { el, uid };
}

/**
 * **Engine-Template** fast path (M3b, #323) — coordinate Engine / Sparse
 * (or Dense) / — / Split: the engine clones a host-resident prototype;
 * no per-node JS runs here. Returns false when the engine family is
 * unavailable or instantiation fails (→ caller interprets; the cell is
 * reported stub). Bookkeeping (elements map, selector attrs, insert
 * tracking) matches the interpreters exactly so every later op works
 * unchanged.
 */
function tryEngineCloneTree(
  tplId: number,
  entry: RegisteredTree,
  baseUid: number,
): boolean {
  if (!engineStagingRequested()) return false;

  // Preorder metadata from the structure: tag, materializability, and the
  // nearest named ancestor for insert tracking.
  const tags: string[] = [];
  const props: TemplateNode[1][] = [];
  const namedParentOf: (number | null)[] = [];
  const addressedSet = entry.addressed ? new Set(entry.addressed) : null;
  const walk = (node: TemplateNode, namedParent: number | null): void => {
    const slot = tags.length;
    tags.push(node[0]);
    props.push(node[1]);
    namedParentOf.push(namedParent);
    const selfNamed = addressedSet ? addressedSet.has(slot) : true;
    for (const child of node[2]) {
      walk(child, selfNamed ? slot : namedParent);
    }
  };
  walk(entry.structure, null);

  const named = entry.addressed ?? tags.map((_, slot) => slot);
  const materializable = (slot: number): boolean => {
    const tag = tags[slot]!;
    if (tag === '#comment') return false;
    if (tag === '#text') {
      const p = props[slot];
      return !!p && p.t !== undefined && p.t !== '';
    }
    return true;
  };

  const wanted = named.filter(materializable);
  const handles = instantiateEngineTemplate(tplId, wanted, pageUniqueId);
  if (!handles) return false;

  const slotToUid = new Map(named.map((s, i) => [s, baseUid + i] as const));
  for (let i = 0; i < wanted.length; i++) {
    const slot = wanted[i]!;
    const uid = slotToUid.get(slot)!;
    const el = handles[i]!;
    elements.set(uid, el);
    installSelectorAttribute(uid, el);
    const parentSlot = namedParentOf[slot];
    if (parentSlot !== null) {
      const parentUid = slotToUid.get(parentSlot);
      if (parentUid !== undefined) trackInsert(parentUid, uid);
    }
  }
  return true;
}

function instantiateRegisteredTree(
  entry: RegisteredTree,
  baseUid: number,
): void {
  if (entry.addressed && entry.addressed.length > 0) {
    const slotToSparse = new Map(
      entry.addressed.map((s, i) => [s, i] as const),
    );
    instantiateTemplateSparse(
      entry.structure,
      baseUid,
      { value: 0 },
      slotToSparse,
      null,
    );
  } else {
    instantiateTemplateDense(entry.structure, baseUid, { value: 0 });
  }
}

export function applyOps(ops: unknown[], flush = true): void {
  const len = ops.length;
  if (len === 0) return;

  // Subtree roots removed in this batch. Moves (KeepAlive storage, Teleport)
  // emit REMOVE followed by INSERT within the same batch, so registry release
  // is deferred until the end of the batch and cancelled by a re-insert.
  const removedRoots = new Set<number>();

  // Detect duplicate batches from double BG bundle evaluation by locating
  // the first allocator frame, rather than assuming it is the first frame.
  if (hasDuplicateFirstAllocator(ops)) return;

  let i = 0;

  while (i < len) {
    const code = ops[i++] as number;

    switch (code) {
      case OP.CREATE: {
        const id = ops[i++] as number;
        const type = ops[i++] as string;
        let el: LynxElement;
        if (type === 'list') {
          el = createListElement(id);
        } else {
          // Use typed PAPI creators for known element types.
          // Native Lynx sets up type-specific internals (e.g. overflow
          // clipping for __CreateView) that __CreateElement may skip.
          el = createTypedElement(type, pageUniqueId);
          // Associate element with CSS scope 0 (common/global CSS)
          // so the CSS selector engine can match class-based rules.
          __SetCSSId([el], 0);
        }
        elements.set(id, el);
        // Set selector attribute for BG-thread NodesRef queries.
        installSelectorAttribute(id, el);
        break;
      }

      case OP.CREATE_TEXT: {
        const id = ops[i++] as number;
        // The BG thread only creates MT text elements for text with content
        // (empty text nodes are BG-only anchors), so no hiding is needed.
        const el = __CreateText(pageUniqueId);
        __SetCSSId([el], 0);
        elements.set(id, el);
        // Set selector attribute for BG-thread NodesRef queries
        installSelectorAttribute(id, el);
        break;
      }

      case OP.INSERT: {
        const parentId = ops[i++] as number;
        const childId = ops[i++] as number;
        const anchorId = ops[i++] as number;
        const parent = elements.get(parentId);
        const child = elements.get(childId);
        if (parent && child) {
          removedRoots.delete(childId);
          trackInsert(parentId, childId);
          if (isListParent(parentId)) {
            insertListItem(parentId, child, childId);
          } else if (anchorId === -1) {
            __AppendElement(parent, child);
          } else {
            const anchor = elements.get(anchorId);
            if (anchor) __InsertElementBefore(parent, child, anchor);
          }
        }
        break;
      }

      case OP.INSERT_TEMPLATE_SLOT: {
        // Slot-index addressing: parent is the slotIndex-th element slot of
        // the template rooted at rootId (see bindTemplateInstanceSlots).
        const rootId = ops[i++] as number;
        const slotIndex = ops[i++] as number;
        const childId = ops[i++] as number;
        const anchorId = ops[i++] as number;
        const parent = getTemplateSlotParent(rootId, slotIndex);
        const child = elements.get(childId);
        if (parent && child) {
          removedRoots.delete(childId);
          // Parent uid for trackInsert is the slot FiberElement's registry
          // id (rootId + holeOffset); use child tracking only — the slot
          // parent is already part of the template instance.
          if (anchorId === -1) {
            __AppendElement(parent, child);
          } else {
            const anchor = elements.get(anchorId);
            if (anchor) __InsertElementBefore(parent, child, anchor);
            else __AppendElement(parent, child);
          }
        }
        break;
      }

      case OP.REMOVE: {
        const parentId = ops[i++] as number;
        const childId = ops[i++] as number;
        const parent = elements.get(parentId);
        const child = elements.get(childId);
        if (parent && child) {
          __RemoveElement(parent, child);
          removedRoots.add(childId);
        }
        // Best-effort: if this REMOVE tears down a template root, drop its
        // slot-index table (holes share the contiguous id range and are not
        // individually removed).
        unbindTemplateInstanceSlots(childId);
        break;
      }

      case OP.REMOVE_TEMPLATE_SLOT: {
        const rootId = ops[i++] as number;
        const slotIndex = ops[i++] as number;
        const childId = ops[i++] as number;
        const parent = getTemplateSlotParent(rootId, slotIndex);
        const child = elements.get(childId);
        if (parent && child) {
          __RemoveElement(parent, child);
          removedRoots.add(childId);
        }
        break;
      }

      case OP.REGISTER_TREE: {
        const tplId = ops[i++] as number;
        const structure = ops[i++] as TemplateNode;
        const addressedOr0 = ops[i++] as number[] | 0;
        const addressed = Array.isArray(addressedOr0)
          ? addressedOr0
          : undefined;
        templates.set(tplId, { structure, addressed });
        // Engine staging: build the host-resident prototype once (fail-safe
        // no-op when the engine family is absent — the cell reports stub).
        if (engineStagingRequested()) {
          registerEngineTemplate(
            tplId,
            buildEngineTemplateDescriptor(
              structure,
              addressed ?? [],
              addressed ?? [],
            ),
          );
        }
        break;
      }

      case OP.CLONE_TREE: {
        const tplId = ops[i++] as number;
        const baseUid = ops[i++] as number;
        const entry = templates.get(tplId);
        if (entry) {
          if (!tryEngineCloneTree(tplId, entry, baseUid)) {
            instantiateRegisteredTree(entry, baseUid);
          }
        }
        break;
      }

      case OP.SET_PROP: {
        const id = ops[i++] as number;
        const key = ops[i++] as string;
        const value = ops[i++];
        if (isPlatformInfoAttr(key)) {
          setPlatformInfoProp(id, key, value);
        } else {
          const el = elements.get(id);
          if (el) __SetAttribute(el, key, value);
        }
        break;
      }

      case OP.SET_TEXT: {
        const id = ops[i++] as number;
        const text = ops[i++] as string;
        const el = elements.get(id);
        if (el) __SetAttribute(el, 'text', text);
        break;
      }

      case OP.SET_EVENT: {
        const id = ops[i++] as number;
        const eventType = ops[i++] as string;
        const eventName = ops[i++] as string;
        const sign = ops[i++];
        const el = elements.get(id);
        if (el) __AddEvent(el, eventType, eventName, sign as string);
        break;
      }

      case OP.REMOVE_EVENT: {
        const id = ops[i++] as number;
        const eventType = ops[i++] as string;
        const eventName = ops[i++] as string;
        const el = elements.get(id);
        // __AddEvent with undefined handler removes the existing listener
        // biome-ignore lint/suspicious/noExplicitAny: __AddEvent(el,type,name,undefined) is the documented way to remove a listener in PAPI
        if (el) __AddEvent(el, eventType, eventName, undefined as any);
        break;
      }

      case OP.SET_STYLE: {
        const id = ops[i++] as number;
        const value = ops[i++] as string | object;
        const el = elements.get(id);
        if (el) __SetInlineStyles(el, value);
        break;
      }

      case OP.SET_CLASS: {
        const id = ops[i++] as number;
        const cls = ops[i++] as string;
        const el = elements.get(id);
        if (el) {
          __SetClasses(el, cls);
        }
        break;
      }

      case OP.SET_ID: {
        const id = ops[i++] as number;
        const idStr = ops[i++] as string | null | undefined;
        const el = elements.get(id);
        if (el) __SetID(el, idStr ?? undefined);
        break;
      }

      case OP.SET_WORKLET_EVENT: {
        const id = ops[i++] as number;
        const eventType = ops[i++] as string;
        const eventName = ops[i++] as string;
        const ctx = ops[i++] as Record<string, unknown>;
        applySetWorkletEvent(id, eventType, eventName, ctx);
        break;
      }

      case OP.SET_MT_REF: {
        const id = ops[i++] as number;
        const refImpl = ops[i++];
        applySetMtRef(id, refImpl);
        break;
      }

      case OP.INIT_MT_REF: {
        const wvid = ops[i++] as number;
        const initValue = ops[i++];
        applyInitMtRef(wvid, initValue);
        break;
      }

      case OP.INSTANTIATE_TEMPLATE: {
        const rootId = ops[i++] as number;
        const tplId = ops[i++] as string;
        const holeCount = ops[i++] as number;
        const entry = getTemplate(tplId);
        let handles: LynxElement[];
        if (entry) {
          // The create() function builds the whole lowered subtree with
          // straight-line PAPI calls and returns [root, hole0, hole1, …].
          handles = entry.create(pageUniqueId);
        } else {
          console.error(
            `[vue-lynx] Unknown element template "${tplId}" on the main thread — rendering a placeholder.`,
          );
          const el = createTypedElement('view', pageUniqueId);
          __SetCSSId([el], 0);
          handles = [el];
        }
        const root = handles[0]!;
        elements.set(rootId, root);
        installSelectorAttribute(rootId, root);
        for (let k = 1; k <= holeCount; k++) {
          elements.set(rootId + k, handles[k] ?? root);
        }
        // Bind element-slot handles for slot-index INSERT/REMOVE.
        bindTemplateInstanceSlots(rootId, handles, entry);
        break;
      }

      default: {
        // Unknown op: skip its payload by arity so one unimplemented opcode
        // cannot desync the rest of the walk. Without an arity there is no
        // safe resync point — stop consuming this batch (the tail below
        // still flushes whatever applied).
        const arity = ARITY[code];
        if (arity === undefined) {
          if (__DEV__) {
            console.warn(
              `[vue-lynx] applyOps: unknown opcode ${code}; `
                + 'dropping the rest of the batch.',
            );
          }
          i = len;
          break;
        }
        i += arity;
        break;
      }
    }
  }

  flushListUpdates();

  // Elements removed and not re-inserted in this batch are gone for good —
  // the BG thread never references them again. Release their subtrees so the
  // registry does not retain unbounded detached trees.
  for (const id of removedRoots) {
    releaseSubtree(id);
  }

  // Flush all pending PAPI changes to the native layer in one shot.
  if (flush) __FlushElementTree();
}

/** Expose elements map so entry-main.ts can seed the page-root entry. */
export { elements };

/** Reset module state – for testing only. */
export function resetMainThreadState(): void {
  clearIfrSelectorAttributeDeferral();
  resetElementRegistry();
  templates.clear();
  resetEngineTemplatesForTesting();
  setPageUniqueId(1);
  resetListState();
  resetWorkletState();
  resetTemplateInstanceSlots();
}
