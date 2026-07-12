// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Flat-array operation codes — the wire protocol between BG Thread and Main Thread.
 *
 * Format (all numbers/strings, JSON-serializable):
 *   CREATE:            [0, id, type]
 *   CREATE_TEXT:       [1, id]
 *   INSERT:            [2, parentId, childId, anchorId]   anchorId=-1 means append
 *   REMOVE:            [3, parentId, childId]
 *   SET_PROP:          [4, id, key, value]
 *   SET_TEXT:          [5, id, text]
 *   SET_EVENT:         [6, id, eventType, eventName, sign]
 *   REMOVE_EVENT:      [7, id, eventType, eventName]
 *   SET_STYLE:         [8, id, styleObject]
 *   SET_CLASS:         [9, id, classString]
 *   SET_ID:            [10, id, idString]
 *   SET_WORKLET_EVENT: [11, id, eventType, eventName, workletCtx]
 *   SET_MT_REF:        [12, id, refImpl]
 *   INIT_MT_REF:       [13, wvid, initValue]
 *   SET_SCOPE_ID:      [14, id, cssId]   // Vue scoped CSS support
 *   REGISTER_TEMPLATE: [15, templateId, structure]
 *     structure: recursive node tuples [tag, props|0, children[]] where
 *     props = { c?: class, s?: styleObj, a?: [[key, value]…], i?: id,
 *     sc?: cssId[], t?: text }. An element whose only child is a #text node
 *     is folded: the text lives in props.t and the child list is empty
 *     (mirrors the BG-side only-child text aliasing).
 *   CLONE_TEMPLATE:    [16, templateId, baseUid]
 *     Instantiates a registered template. Element ids are assigned
 *     deterministically: pre-order traversal of the structure starting at
 *     baseUid — the BG thread allocates the identical contiguous block, so
 *     both sides agree on ids without transmitting them.
 */
export const OP = {
  CREATE: 0,
  CREATE_TEXT: 1,
  INSERT: 2,
  REMOVE: 3,
  SET_PROP: 4,
  SET_TEXT: 5,
  SET_EVENT: 6,
  REMOVE_EVENT: 7,
  SET_STYLE: 8,
  SET_CLASS: 9,
  SET_ID: 10,
  SET_WORKLET_EVENT: 11,
  SET_MT_REF: 12,
  INIT_MT_REF: 13,
  SET_SCOPE_ID: 14,
  REGISTER_TEMPLATE: 15,
  CLONE_TEMPLATE: 16,
} as const;

export type OpCode = (typeof OP)[keyof typeof OP];

// ---------------------------------------------------------------------------
// REGISTER_TEMPLATE structure — the ONE definition both threads must agree
// on. The BG thread builds this shape (shadow-element.ts buildStructure) and
// the MT interprets it (ops-apply.ts instantiateTemplate); uids are assigned
// by identical pre-order walks on both sides, so any drift in this shape or
// in traversal order silently desyncs element ids across the thread boundary.
// ---------------------------------------------------------------------------

/** Static props of one template node. */
export interface TemplateNodeProps {
  /** class */
  c?: string;
  /** inline style (parsed object form) */
  s?: Record<string, unknown>;
  /** plain attributes */
  a?: [string, string][];
  /** id attribute */
  i?: string;
  /** scope cssIds */
  sc?: number[];
  /** folded only-child text content */
  t?: string;
}

/** [tag, props|0, children] */
export type TemplateNode = [string, TemplateNodeProps | 0, TemplateNode[]];

// Global names bridging the vapor build plugin and the runtime DOM shim:
// the plugin's DefinePlugin rewrites free `document`/`window` identifiers to
// `globalThis.<name>`, and vapor/dom-shim.ts installs the shims under the
// same names. Import from here on both sides — a rename must not be able to
// drift silently.
export const VAPOR_DOCUMENT_GLOBAL = '__VUE_LYNX_DOCUMENT__';
export const VAPOR_WINDOW_GLOBAL = '__VUE_LYNX_WINDOW__';
