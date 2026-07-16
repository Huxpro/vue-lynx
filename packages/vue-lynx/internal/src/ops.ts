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
 *   (retired)          [14]  was SET_SCOPE_ID — scoped CSS now rides on
 *     classes (scope tokens merge into SET_CLASS / props.c), so no op emits
 *     14 anymore. The number is not reused to keep old bundles unambiguous.
 *   REGISTER_TEMPLATE: [15, templateId, structure]
 *     structure: recursive node tuples [tag, props|0, children[]] where
 *     props = { c?: class, s?: styleObj, a?: [[key, value]…], i?: id,
 *     t?: text }. An element whose only child is a #text node
 *     is folded: the text lives in props.t and the child list is empty
 *     (mirrors the BG-side only-child text aliasing).
 *   CLONE_TEMPLATE:    [16, templateId, baseUid]
 *     Instantiates a registered template. Element ids are assigned
 *     deterministically: pre-order traversal of the structure starting at
 *     baseUid — the BG thread allocates the identical contiguous block, so
 *     both sides agree on ids without transmitting them.
 */
export const PAGE_ROOT_ID = 1;

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
  // 14 retired (was SET_SCOPE_ID) — do not reuse.
  REGISTER_TEMPLATE: 15,
  CLONE_TEMPLATE: 16,
} as const;

export type OpCode = (typeof OP)[keyof typeof OP];

/** Number of payload fields following each active opcode in the flat stream. */
export const OP_ARITY: Readonly<Record<number, number>> = Object.freeze({
  [OP.CREATE]: 2,
  [OP.CREATE_TEXT]: 1,
  [OP.INSERT]: 3,
  [OP.REMOVE]: 2,
  [OP.SET_PROP]: 3,
  [OP.SET_TEXT]: 2,
  [OP.SET_EVENT]: 4,
  [OP.REMOVE_EVENT]: 3,
  [OP.SET_STYLE]: 2,
  [OP.SET_CLASS]: 2,
  [OP.SET_ID]: 2,
  [OP.SET_WORKLET_EVENT]: 4,
  [OP.SET_MT_REF]: 2,
  [OP.INIT_MT_REF]: 2,
  [OP.REGISTER_TEMPLATE]: 2,
  [OP.CLONE_TEMPLATE]: 2,
});

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

// DOM constructor identifiers referenced freely by @vue/runtime-vapor (and
// runtime-dom) for `instanceof` classification and prototype warm-ups. They
// must ALWAYS resolve to the ShadowElement-aware shims, never to a host DOM.
// This matters on Lynx for Web: the Background Thread runs in a Worker (no
// DOM globals — the shim's global installs win), but the Main Thread Lepus
// chunk executes on the page's main thread, where real `Node`/`Element`/
// `Text` globals exist. Under IFR the full Vapor runtime evaluates there, and
// classifying a ShadowElement with `instanceof <real DOM Node>` returns
// false, which sends insert() down the fragment path and crashes the first
// frame. The plugin therefore rewrites these identifiers to the globals
// below, which the shim installs unconditionally in every realm.
export const VAPOR_DOM_CTOR_GLOBALS: Readonly<Record<string, string>> = Object
  .freeze({
    Node: '__VUE_LYNX_NODE__',
    Element: '__VUE_LYNX_ELEMENT__',
    Text: '__VUE_LYNX_TEXT__',
    Comment: '__VUE_LYNX_COMMENT__',
    CharacterData: '__VUE_LYNX_CHARACTER_DATA__',
    DocumentFragment: '__VUE_LYNX_DOCUMENT_FRAGMENT__',
    HTMLElement: '__VUE_LYNX_HTML_ELEMENT__',
    SVGElement: '__VUE_LYNX_SVG_ELEMENT__',
    MathMLElement: '__VUE_LYNX_MATHML_ELEMENT__',
    HTMLSlotElement: '__VUE_LYNX_HTML_SLOT_ELEMENT__',
    HTMLStyleElement: '__VUE_LYNX_HTML_STYLE_ELEMENT__',
    ShadowRoot: '__VUE_LYNX_SHADOW_ROOT__',
    Document: '__VUE_LYNX_DOCUMENT_CTOR__',
  });
