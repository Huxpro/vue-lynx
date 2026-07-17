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
 *   INSTANTIATE_TEMPLATE: [15, rootId, tplId, holeCount]
 *     Element-template instantiation (compile-time-lowered static subtree).
 *     The main thread builds the whole subtree via the registered create()
 *     function; the root maps to rootId and the template's holes (interior
 *     nodes with dynamic parts) map to rootId+1 … rootId+holeCount, so all
 *     later SET_* ops target them like ordinary elements.
 *   REGISTER_TREE:     [16, treeId, structure]
 *     structure: recursive node tuples [tag, props|0, children[]] where
 *     props = { c?: class, s?: styleObj, a?: [[key, value]…], i?: id,
 *     t?: text }. An element whose only child is a #text node
 *     is folded: the text lives in props.t and the child list is empty
 *     (mirrors the BG-side only-child text aliasing).
 *   CLONE_TREE:        [17, treeId, baseUid]
 *     Instantiates a registered tree. Element ids are assigned
 *     deterministically: pre-order traversal of the structure starting at
 *     baseUid — the BG thread allocates the identical contiguous block, so
 *     both sides agree on ids without transmitting them.
 *
 * Naming: INSTANTIATE_TEMPLATE (15) and REGISTER_TREE/CLONE_TREE (16/17) are
 * genuinely different mechanisms, named by mechanism rather than renderer.
 * The ET op registers baked create() code at build time and names only root
 * + holes (sparse, id-light — the closed dynamic-point set is proved by the
 * VDOM compiler's block analysis): a standard template + closed parts list,
 * hence TEMPLATE. The vapor object is a named tree prototype — serialized
 * structure over the wire plus dense pre-order naming, required because Vapor
 * codegen's addressing knowledge lives in navigation code the protocol cannot
 * see — hence TREE, not TEMPLATE.
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
  // 14 retired (was SET_SCOPE_ID) — do not reuse. Scoped CSS rides on
  // classes (scope tokens merge into SET_CLASS / props.c).
  INSTANTIATE_TEMPLATE: 15,
  REGISTER_TREE: 16,
  CLONE_TREE: 17,
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
  [OP.INSTANTIATE_TEMPLATE]: 3,
  [OP.REGISTER_TREE]: 2,
  [OP.CLONE_TREE]: 2,
});

// ---------------------------------------------------------------------------
// Element-template protocol (INSTANTIATE_TEMPLATE support)
// ---------------------------------------------------------------------------

/** Type-string prefix for compile-time-lowered template vnodes. */
export const TPL_TYPE_PREFIX = '__vlx-tpl:';
/** Prop-key prefix for hole bindings on lowered vnodes. */
export const TPL_HOLE_PREFIX = '__h';
/**
 * Name of the global through which compiler-generated code registers
 * element templates: `globalThis.<TPL_REGISTER_GLOBAL>(id, holes, create)`.
 * Referenced by compiler codegen, the loader that extracts registrations for
 * interpreter-only MT bundles, and the runtime/main-thread installers.
 */
export const TPL_REGISTER_GLOBAL = '__vueLynxRegisterElementTemplate';

// ---------------------------------------------------------------------------
// Cross-thread global handshakes (IFR)
//
// The runtime and main-thread packages cannot import each other (they are
// bundled for different threads), so IFR wires them through globals. Every
// read site is defensively guarded, which means a one-sided rename would not
// throw — it would silently disable IFR. Single-sourcing the names here makes
// that drift impossible.
// ---------------------------------------------------------------------------

/** Set on the IFR main thread so runtime code can detect the environment. */
export const IFR_MT_FLAG_GLOBAL = '__VUE_LYNX_IFR_MT__';
/** MT-side hook the runtime flush hands ops batches to during the IFR render. */
export const IFR_APPLY_OPS_GLOBAL = '__vueLynxIfrApplyOps';
/** Runtime-side hook renderPage triggers to run deferred IFR mounts. */
export const IFR_MOUNT_APPS_GLOBAL = '__vueLynxIfrMountApps';
/** MT executor registry for element-template create() functions. */
export const TPL_EXECUTOR_REGISTRY_GLOBAL = '__vueLynxRegisterTemplate';

// ---------------------------------------------------------------------------
// REGISTER_TREE structure — the ONE definition both threads must agree
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
