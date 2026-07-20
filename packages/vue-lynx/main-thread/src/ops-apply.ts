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
  bakeDenseTreeCreate,
  type DenseTreeCreator,
} from './bake-tree-create.js';
import {
  elements,
  pageUniqueId,
  releaseSubtree,
  resetElementRegistry,
  setPageUniqueId,
  trackInsert,
} from './element-registry.js';
import { getTemplate } from './element-templates.js';
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
/** Baked dense creators — one per REGISTER_TREE id (milestone-1 ET bridge). */
const bakedCreators = new Map<number, DenseTreeCreator>();

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

/**
 * Instantiate a registered template via the baked dense creator.
 *
 * Element ids are assigned by pre-order traversal starting at baseUid — the
 * exact allocation order the BG thread used for its shadow clone, so both
 * sides agree without a transmitted map. Comments / empty #text consume a
 * uid slot without creating a native element (BG-only anchors).
 *
 * The bake is the milestone-1 bridge toward Element-Template-shaped IFR
 * paint for Vapor: same dense naming as the historical recursive walk, but
 * as a straight-line program. Sparse (hole-only) naming for the disposable
 * IFR MT path lives in `bakeSparseTreeCreate`.
 */
function instantiateTemplate(
  creator: DenseTreeCreator,
  baseUid: number,
): { el: LynxElement; uid: number } | null {
  return creator(pageUniqueId, baseUid, {
    elements,
    installSelectorAttribute,
  });
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

      case OP.REGISTER_TREE: {
        const tplId = ops[i++] as number;
        const structure = ops[i++] as TemplateNode;
        templates.set(tplId, structure);
        bakedCreators.set(tplId, bakeDenseTreeCreate(structure));
        break;
      }

      case OP.CLONE_TREE: {
        const tplId = ops[i++] as number;
        const baseUid = ops[i++] as number;
        const creator = bakedCreators.get(tplId);
        if (creator) {
          instantiateTemplate(creator, baseUid);
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
        const create = getTemplate(tplId);
        let handles: LynxElement[];
        if (create) {
          handles = create(pageUniqueId);
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
  bakedCreators.clear();
  setPageUniqueId(1);
  resetListState();
  resetWorkletState();
}
