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

const templates = new Map<number, TemplateNode>();

const ARITY = OP_ARITY as Readonly<Record<number, number | undefined>>;

// NodesRef selector attributes are only consumed by the Background Thread.
// IFR can paint without them, then install them immediately before BG adopts
// the tree. Keeping this state here makes CREATE and CLONE_TEMPLATE follow the
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

    if (code === OP.CREATE || code === OP.CREATE_TEXT) {
      return elements.has(ops[cursor + 1] as number);
    }
    if (code === OP.REGISTER_TEMPLATE) {
      return templates.has(ops[cursor + 1] as number);
    }
    if (code === OP.CLONE_TEMPLATE) {
      return elements.has(ops[cursor + 2] as number);
    }

    cursor += arity + 1;
  }
  return false;
}

/**
 * Instantiate a registered template. Element ids are assigned by pre-order
 * traversal starting at baseUid — the exact allocation order the BG thread
 * used for its shadow clone, so both sides agree without a transmitted map.
 *
 * Comment nodes and empty #text nodes are Background Thread anchors: the
 * walk consumes their uid (keeping both sides' pre-order counters in
 * lockstep) but creates no Main Thread element — returns null.
 */
function instantiateTemplate(
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

  if (props) {
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

  for (const childNode of children) {
    const child = instantiateTemplate(childNode, base, counter);
    if (child) {
      __AppendElement(el, child.el);
      trackInsert(uid, child.uid);
    }
  }
  return { el, uid };
}

export function applyOps(ops: unknown[]): void {
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

      case OP.REMOVE: {
        const parentId = ops[i++] as number;
        const childId = ops[i++] as number;
        const parent = elements.get(parentId);
        const child = elements.get(childId);
        if (parent && child) {
          __RemoveElement(parent, child);
          removedRoots.add(childId);
        }
        break;
      }

      case OP.REGISTER_TEMPLATE: {
        const tplId = ops[i++] as number;
        const structure = ops[i++] as TemplateNode;
        templates.set(tplId, structure);
        break;
      }

      case OP.CLONE_TEMPLATE: {
        const tplId = ops[i++] as number;
        const baseUid = ops[i++] as number;
        const structure = templates.get(tplId);
        if (structure) {
          instantiateTemplate(structure, baseUid, { value: 0 });
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

      default:
        // Unknown op – skip (future-compat)
        break;
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
  __FlushElementTree();
}

/** Expose elements map so entry-main.ts can seed the page-root entry. */
export { elements };

/** Reset module state – for testing only. */
export function resetMainThreadState(): void {
  clearIfrSelectorAttributeDeferral();
  resetElementRegistry();
  templates.clear();
  setPageUniqueId(1);
  resetListState();
  resetWorkletState();
}
