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

import { OP } from 'vue-lynx/internal/ops';

import {
  elements,
  pageUniqueId,
  setPageUniqueId,
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

/**
 * Text content is materialised as a `raw-text` child element — the canonical
 * Lynx encoding (ReactLynx does the same). Setting a `text` attribute on the
 * text element itself renders too, but loses newline handling on Lynx for
 * Web (`raw-text` preserves `\n` as line breaks; a plain attribute/text node
 * collapses whitespace).
 */
const rawTextChildren = new Map<number, LynxElement>();

/** CREATE_TEXT elements currently hidden because their text is empty. */
const emptyTextNodes = new Set<number>();

function setElementRawText(el: LynxElement, id: number, text: string): void {
  // Un-hide a text node once it has content (see CREATE_TEXT); re-hide it
  // when the content goes back to empty so it stays layout-inert.
  if (text !== '' && emptyTextNodes.has(id)) {
    emptyTextNodes.delete(id);
    __SetInlineStyles(el, '');
  } else if (text === '' && !emptyTextNodes.has(id) && isTextNode(id)) {
    emptyTextNodes.add(id);
    __SetInlineStyles(el, 'display:none');
  }

  let raw = rawTextChildren.get(id);
  if (!raw) {
    raw = __CreateRawText(text);
    __AppendElement(el, raw);
    rawTextChildren.set(id, raw);
    return;
  }
  __SetAttribute(raw, 'text', text);
}

/** Ids created via CREATE_TEXT (Vue text vnodes), ever. */
const textNodeIds = new Set<number>();

function isTextNode(id: number): boolean {
  return textNodeIds.has(id);
}

export function applyOps(ops: unknown[]): void {
  const len = ops.length;
  if (len === 0) return;

  // Detect duplicate batch from double BG bundle evaluation.
  // Each __init_card_bundle__ invocation gets a fresh webpack module cache, so
  // ShadowElement.nextId resets to 2, producing the same element IDs.
  // If the first CREATE op targets an ID that already exists in our elements Map,
  // this is a duplicate batch — skip it entirely.
  if (len >= 3 && ops[0] === OP.CREATE) {
    const firstId = ops[1] as number;
    if (elements.has(firstId)) {
      return;
    }
  }

  let i = 0;

  while (i < len) {
    const code = ops[i++] as number;

    switch (code) {
      case OP.CREATE: {
        const id = ops[i++] as number;
        const type = ops[i++] as string;
        let el: LynxElement;
        if (type === '__comment') {
          // Vue uses comment nodes as Fragment / v-if anchors.
          // Create a display:none view so the anchor is fully layout-inert:
          // a zero-size element still counts as a flex item and consumes a
          // `gap` slot, which skews containers using CSS gap (ReactLynx has
          // no anchor elements at all — fragments are virtual there).
          el = __CreateView(pageUniqueId);
          __SetInlineStyles(el, 'display:none');
        } else if (type === 'list') {
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
        // Comment nodes (__CreateRawText) can't have attributes.
        if (type !== '__comment') {
          __SetAttribute(el, `vue-ref-${id}`, 1);
        }
        break;
      }

      case OP.CREATE_TEXT: {
        const id = ops[i++] as number;
        const el = __CreateText(pageUniqueId);
        __SetCSSId([el], 0);
        elements.set(id, el);
        // Set selector attribute for BG-thread NodesRef queries
        __SetAttribute(el, `vue-ref-${id}`, 1);
        // Text nodes start empty (SET_TEXT follows when there is content).
        // Hide empty text nodes so anchors/empty runs are layout-inert —
        // an empty flex item still consumes a CSS `gap` slot.
        __SetInlineStyles(el, 'display:none');
        emptyTextNodes.add(id);
        textNodeIds.add(id);
        break;
      }

      case OP.INSERT: {
        const parentId = ops[i++] as number;
        const childId = ops[i++] as number;
        const anchorId = ops[i++] as number;
        const parent = elements.get(parentId);
        const child = elements.get(childId);
        if (parent && child) {
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
        if (el) setElementRawText(el, id, text);
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

      case OP.SET_SCOPE_ID: {
        const id = ops[i++] as number;
        const cssId = ops[i++] as number;
        const el = elements.get(id);
        if (el) {
          // Set the CSS scope ID for Lynx's CSS engine
          __SetCSSId([el], cssId);
        }
        break;
      }

      default:
        // Unknown op – skip (future-compat)
        break;
    }
  }

  flushListUpdates();

  // Flush all pending PAPI changes to the native layer in one shot.
  __FlushElementTree();
}

/** Expose elements map so entry-main.ts can seed the page-root entry. */
export { elements };

/** Reset module state – for testing only. */
export function resetMainThreadState(): void {
  elements.clear();
  rawTextChildren.clear();
  emptyTextNodes.clear();
  textNodeIds.clear();
  setPageUniqueId(1);
  resetListState();
  resetWorkletState();
}
