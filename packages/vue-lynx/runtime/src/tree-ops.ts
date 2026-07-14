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
  if (child.parent && child.parent !== parent) {
    pushOp(OP.REMOVE, child.parent.uid, child.uid);
  }

  // Always update the shadow tree (Vue needs it for internal diffing).
  parent._link(child, anchor ?? null);

  // Lynx's native <list> only accepts <list-item> children.
  // Vue's v-for creates comment anchor nodes as fragment markers —
  // skip sending them to the Main Thread to avoid NSInvalidArgumentException.
  if (
    parent.tag === 'list'
    && (child.tag === '#comment' || child.tag === '#text')
  ) {
    return;
  }

  // If the anchor is a comment node inside a <list>, it was never inserted
  // on the Main Thread. Walk forward to find the next real (non-comment)
  // sibling so __InsertElementBefore has a valid reference.
  let resolvedAnchor: ShadowElement | null = anchor ?? null;
  if (parent.tag === 'list') {
    while (
      resolvedAnchor
      && (resolvedAnchor.tag === '#comment'
        || resolvedAnchor.tag === '#text')
    ) {
      resolvedAnchor = resolvedAnchor.next;
    }
  }

  const anchorId = resolvedAnchor ? resolvedAnchor.uid : -1;
  pushOp(OP.INSERT, parent.uid, child.uid, anchorId);
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
    const parentUid = child.parent.uid;
    child.parent._unlink(child);
    releaseSubtree(child);
    pushOp(OP.REMOVE, parentUid, child.uid);
    scheduleFlush();
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
    el._unlink(child);
    releaseSubtree(child);
    pushOp(OP.REMOVE, el.uid, child.uid);
  }
  // Set text content directly on the element
  pushOp(OP.SET_TEXT, el.uid, text);
  scheduleFlush();
}
