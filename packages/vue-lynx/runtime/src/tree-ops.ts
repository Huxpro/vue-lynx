// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Shared tree mutation core.
 *
 * Both the vdom renderer (`node-ops.ts`, via Vue's RendererOptions) and the
 * Vapor DOM-compat layer (`shadow-element.ts` DOM methods, called directly by
 * `@vue/runtime-vapor`) mutate the ShadowElement tree and emit ops to the
 * Main Thread. This module holds the single implementation of those
 * mutations so the two entry points cannot drift.
 *
 * Only type-imports `ShadowElement` to stay cycle-free:
 *   node-ops.ts ──▶ shadow-element.ts ──▶ tree-ops.ts (types only)
 */

import { scheduleFlush } from './flush.js';
import { OP, pushOp } from './ops.js';
import {
  normalizeStylePropertyName,
  normalizeStyleValue,
} from './style-normalization.js';
import type { ShadowElement } from './shadow-element.js';

// ---------------------------------------------------------------------------
// Teleport id registry — id string → ShadowElement
// ---------------------------------------------------------------------------

export const idRegistry: Map<string, ShadowElement> = new Map();

/**
 * Single-walk teardown for a subtree being removed: clean up the Teleport id
 * registry AND release Vapor addEventListener registrations. One recursion
 * instead of two — removal is a hot path (clearing a 10k-row list visits
 * every node).
 */
export function releaseSubtree(el: ShadowElement): void {
  if (el._id) idRegistry.delete(el._id);
  el._releaseOwnEvents();
  let child = el.firstChild;
  while (child) {
    releaseSubtree(child);
    child = child.next;
  }
}

// ---------------------------------------------------------------------------
// Class resolution — merges user, Vue scope, and transition classes
// ---------------------------------------------------------------------------

export function resolveClass(el: ShadowElement): string {
  const parts: string[] = [];
  if (el._baseClass) parts.push(el._baseClass);
  for (const cls of el._scopeClasses) parts.push(cls);
  for (const cls of el._transitionClasses) parts.push(cls);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

/** Emit SET_STYLE for the element's current style, respecting v-show. */
export function pushStyleOp(el: ShadowElement): void {
  const effective = el._vShowHidden
    ? { ...el._style, display: 'none' }
    : el._style;
  pushOp(OP.SET_STYLE, el.uid, effective);
  scheduleFlush();
}

/** Parse an inline CSS string ("color:red;height:40px") into an object. */
/** Inverse of parseInlineStyle — one shared serializer for style readbacks. */
export function serializeInlineStyle(style: Record<string, unknown>): string {
  let out = '';
  for (const k in style) out += `${k}:${style[k]};`;
  return out;
}

export function parseInlineStyle(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const decl of text.split(';')) {
    const idx = decl.indexOf(':');
    if (idx <= 0) continue;
    const key = normalizeStylePropertyName(decl.slice(0, idx).trim());
    const value = decl.slice(idx + 1).trim();
    if (key) out[key] = normalizeStyleValue(key, value);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Id attribute
// ---------------------------------------------------------------------------

export function setIdAttr(el: ShadowElement, value: unknown): void {
  if (el._id) idRegistry.delete(el._id);
  el._id = value != null ? String(value) : undefined;
  if (__DEV__ && el._id && idRegistry.has(el._id) && idRegistry.get(el._id) !== el) {
    console.warn(
      `[vue-lynx] Duplicate id "${el._id}" detected. Teleport target resolution may be unreliable.`,
    );
  }
  if (el._id) idRegistry.set(el._id, el);
  pushOp(OP.SET_ID, el.uid, value);
  scheduleFlush();
}

// ---------------------------------------------------------------------------
// Main Thread materialization
//
// Comment nodes and empty #text nodes are renderer bookkeeping (v-if /
// Fragment / Vapor block anchors) — they exist only in the Background Thread
// shadow tree and never reach the Main Thread. Native Lynx gives an empty
// raw-text node a default line box, so materialising anchors adds visible
// height; keeping them BG-only removes the artifact and the per-anchor
// native element. A #text node is materialised lazily, only while it has
// content (`_mtCreated`: MT element exists; `_mtInserted`: currently in the
// MT tree).
// ---------------------------------------------------------------------------

/** Does this node currently have a Main Thread element in the MT tree? */
export function isMaterialized(node: ShadowElement): boolean {
  if (node.tag === '#comment') return false;
  if (node.tag === '#text') return node._mtInserted;
  return true;
}

/**
 * Shadow-only anchors have no Main Thread element. Walk forward to the next
 * materialised sibling so __InsertElementBefore receives a valid reference.
 */
export function resolveMainThreadAnchor(
  anchor: ShadowElement | null | undefined,
): ShadowElement | null {
  let resolved = anchor ?? null;
  while (resolved && !isMaterialized(resolved)) {
    resolved = resolved.next;
  }
  return resolved;
}

/** Emit CREATE_TEXT for a #text node's MT element if it doesn't exist yet. */
function ensureTextCreated(node: ShadowElement): void {
  if (node._mtCreated) return;
  pushOp(OP.CREATE_TEXT, node.uid);
  node._mtCreated = true;
}

/** Emit INSERT or INSERT_TEMPLATE_SLOT depending on the parent. */
function pushInsertOp(
  parent: ShadowElement,
  child: ShadowElement,
  anchorUid: number,
): void {
  if (
    parent._tplSlotIndex !== undefined && parent._tplRoot !== undefined
  ) {
    // Element-slot wrapper: address by (templateRoot, slotIndex) so sparse
    // ET can keep the slot parent anonymous.
    pushOp(
      OP.INSERT_TEMPLATE_SLOT,
      parent._tplRoot.uid,
      parent._tplSlotIndex,
      child.uid,
      anchorUid,
    );
  } else {
    pushOp(OP.INSERT, parent.uid, child.uid, anchorUid);
  }
}

/** Emit REMOVE or REMOVE_TEMPLATE_SLOT depending on the parent. */
function pushRemoveOp(parent: ShadowElement, child: ShadowElement): void {
  if (
    parent._tplSlotIndex !== undefined && parent._tplRoot !== undefined
  ) {
    pushOp(
      OP.REMOVE_TEMPLATE_SLOT,
      parent._tplRoot.uid,
      parent._tplSlotIndex,
      child.uid,
    );
  } else {
    pushOp(OP.REMOVE, parent.uid, child.uid);
  }
}

/**
 * Optional hook: tear down element-slot Vue trees before a template root is
 * removed. Installed from node-ops to avoid a tree-ops ↔ slot-host cycle.
 */
let teardownTemplateSlotsHook:
  | ((el: ShadowElement) => void)
  | null = null;

/** @internal */
export function setTeardownTemplateSlotsHook(
  fn: ((el: ShadowElement) => void) | null,
): void {
  teardownTemplateSlotsHook = fn;
}

/**
 * Set a #text node's character data, materialising or dematerialising its
 * Main Thread element as the content appears / disappears. Shared by the
 * vdom renderer's setText and the Vapor nodeValue/data setters.
 */
export function setTextNode(node: ShadowElement, text: string): void {
  node._text = text;

  if (!text) {
    if (node._mtInserted && node.parent) {
      pushRemoveOp(node.parent, node);
      node._mtInserted = false;
      scheduleFlush();
    }
    return;
  }

  ensureTextCreated(node);
  pushOp(OP.SET_TEXT, node.uid, text);

  // Lynx's native <list> only accepts <list-item> children — text nodes
  // there stay off the Main Thread entirely.
  const parent = node.parent;
  if (!node._mtInserted && parent && parent.tag !== 'list') {
    const anchor = resolveMainThreadAnchor(node.next);
    pushInsertOp(parent, node, anchor ? anchor.uid : -1);
    node._mtInserted = true;
  }
  scheduleFlush();
}

// ---------------------------------------------------------------------------
// Structural mutations
// ---------------------------------------------------------------------------

/**
 * Insert `child` into `parent` before `anchor`, updating the shadow tree and
 * emitting INSERT (plus REMOVE for reparenting) ops. Contains the Lynx
 * `<list>` special cases shared by vdom insert and Vapor insertBefore.
 */
export function insertNode(
  child: ShadowElement,
  parent: ShadowElement,
  anchor?: ShadowElement | null,
): void {
  // The parent may carry an aliased only-child #text node (Vapor template
  // clone fast path) that has no Main Thread counterpart yet — materialize
  // it before the child list changes structurally.
  parent._materializeAliasedText();

  // Reparent: if child is moving to a different parent (e.g. KeepAlive move),
  // emit REMOVE from old parent so MT correctly detaches first.
  if (child.parent && child.parent !== parent && isMaterialized(child)) {
    pushRemoveOp(child.parent, child);
    if (child.tag === '#text') child._mtInserted = false;
    scheduleFlush();
  }

  // Always update the shadow tree (Vue needs it for internal diffing).
  parent._link(child, anchor ?? null);

  // Shadow-only anchors: comments always, text while empty or under <list>.
  if (child.tag === '#comment') return;
  if (child.tag === '#text' && (!child._text || parent.tag === 'list')) {
    return;
  }

  if (child.tag === '#text') ensureTextCreated(child);

  const resolvedAnchor = resolveMainThreadAnchor(anchor);
  pushInsertOp(
    parent,
    child,
    resolvedAnchor ? resolvedAnchor.uid : -1,
  );
  if (child.tag === '#text') child._mtInserted = true;
  scheduleFlush();
}

/** Detach `child` from its parent, emitting a REMOVE op. */
export function removeNode(child: ShadowElement): void {
  // Aliased only-child #text: no Main Thread element exists — clear the
  // host's text instead of emitting a REMOVE. (child may be null: Teleport
  // unmount iterates children that never mounted.)
  if (child?._textHost) {
    const host = child._textHost;
    host._aliasedTextChild = undefined;
    child._textHost = undefined;
    host._unlink(child);
    pushOp(OP.SET_TEXT, host.uid, '');
    scheduleFlush();
    return;
  }
  // Vue's Teleport iterates its children on unmount even when target
  // resolution failed at mount (see @vue/runtime-core TeleportImpl.remove).
  // Those children were never mounted, so `vnode.el` is undefined — null
  // guard is required here, not just for the `!parent` case.
  if (child?.parent) {
    const parent = child.parent;
    const materialized = isMaterialized(child);
    // Tear down element-slot Vue trees before removing a template root so
    // component instances inside slots get proper unmount lifecycles.
    if (child._tplSlots) teardownTemplateSlotsHook?.(child);
    parent._unlink(child);
    releaseSubtree(child);
    if (materialized) {
      pushRemoveOp(parent, child);
      scheduleFlush();
    }
    if (child.tag === '#text') child._mtInserted = false;
  }
}

/** Replace an element's children with a plain text content. */
export function setElementTextContent(el: ShadowElement, text: string): void {
  // An aliased #text child has no MT counterpart — drop it silently; the
  // SET_TEXT below covers the host.
  if (el._aliasedTextChild) {
    const aliased = el._aliasedTextChild;
    el._aliasedTextChild = undefined;
    aliased._textHost = undefined;
    el._unlink(aliased);
  }
  // Remove all children from shadow tree
  while (el.firstChild) {
    const child = el.firstChild;
    const materialized = isMaterialized(child);
    el._unlink(child);
    releaseSubtree(child);
    if (materialized) pushOp(OP.REMOVE, el.uid, child.uid);
    if (child.tag === '#text') child._mtInserted = false;
  }
  // Set text content directly on the element
  pushOp(OP.SET_TEXT, el.uid, text);
  scheduleFlush();
}
