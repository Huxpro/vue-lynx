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
 *     Holes are either attr/text bindings or element slots (`TPL_SLOT_KEY`).
 *     Element-slot count is not a separate op argument — it is the count of
 *     `TPL_SLOT_KEY` entries in the template's registered hole-key list.
 *   REGISTER_TREE:     [16, treeId, structure, addressedOr0]
 *     structure: recursive node tuples [tag, props|0, children[]] where
 *     props = { c?: class, s?: styleObj, a?: [[key, value]…], i?: id,
 *     t?: text }. An element whose only child is a #text node
 *     is folded: the text lives in props.t and the child list is empty
 *     (mirrors the BG-side only-child text aliasing).
 *     addressedOr0: `0` = dense A1 naming (every preorder slot); otherwise a
 *     sorted number[] of REGISTER_TREE preorder slots that receive names
 *     (sparse A2 — compiler `__vlxAddressing.addressed`).
 *   CLONE_TREE:        [17, treeId, baseUid]
 *     Instantiates a registered tree.
 *     Dense (addressedOr0 === 0): element ids are assigned by pre-order
 *     traversal starting at baseUid — the BG thread allocates the identical
 *     contiguous block.
 *     Sparse (addressed list present): only addressed slots are named;
 *     uid = baseUid + indexInAddressed. Static skeleton nodes are built as
 *     anonymous write-only natives. Dynamic children under anonymous parents
 *     use INSERT_TEMPLATE_SLOT (18/19) by slot-index.
 *   INSERT_TEMPLATE_SLOT: [18, rootId, slotIndex, childId, anchorId]
 *     Insert a dynamic child into the slotIndex-th element slot of the
 *     template instance rooted at rootId (slot-index addressing — the slot
 *     parent may be anonymous under sparse A2). anchorId=-1 → append.
 *   REMOVE_TEMPLATE_SLOT: [19, rootId, slotIndex, childId]
 *     Remove a dynamic child from the slotIndex-th element slot.
 *   BIND_VAPOR_TEMPLATE: [21, treeId, codeTplId]
 *     Code staging (`+b:c`, #337): binds the BG's numeric per-realm tree id
 *     to a bundle-baked create() registry id (a content-hash string), once
 *     per template. INSTANTIATE_TEMPLATE then carries the NUMERIC id per
 *     instance, so per-clone wire frames stay the same size as CLONE_TREE
 *     — the string id crosses exactly once.
 *   REGISTER_TREE_BUNDLE: [20, treeId, structureHash, addressedOr0]
 *     Bundle-delivered REGISTER_TREE (the `+b!` cell, #338): the structure
 *     AST was baked into the MT bundle at build time
 *     (`registerVaporStructure(hash, structure)`); only the fingerprint hash
 *     and the (tiny) naming list cross the wire. The MT resolves hash →
 *     structure from its bundle registry and stores the tree exactly as a
 *     wire REGISTER_TREE would — CLONE_TREE and everything downstream is
 *     unchanged. The BG only emits this op when its runtime-parsed structure
 *     hash equals the build-time-parsed hash stamped on the template factory
 *     (fingerprint fail-safe); on mismatch it falls back to full
 *     REGISTER_TREE, so correctness never rides on the build-time parse.
 *
 * Naming: INSTANTIATE_TEMPLATE (15) and REGISTER_TREE/CLONE_TREE (16/17) are
 * genuinely different mechanisms, named by mechanism rather than renderer.
 * The ET op registers baked create() code at build time and names only root
 * + holes (sparse, id-light — the closed dynamic-point set is proved by the
 * VDOM compiler's block analysis): a standard template + closed parts list,
 * hence TEMPLATE. The vapor object is a named tree prototype — serialized
 * structure over the wire. Dense A1 naming was required because Vapor
 * codegen's addressing knowledge lived in navigation code the protocol could
 * not see; sparse A2 (#298) consumes compile-time `__vlxAddressing` so TREE
 * naming can match ET's sparse model while keeping dense CLONE_TREE as
 * fallback when analysis is absent. Element-slot ops (18/19) let dynamic
 * subtrees graft by slot-index when the insert parent is anonymous.
 *
 * Four-axis coordinates (see vue-lynx/internal/matrix — Staging × Naming ×
 * Provenance × Deployment; a subtree = `λ holes. tree`, ops materialize its
 * residual):
 *  - INSTANTIATE_TEMPLATE (15) — Code / Sparse / intrinsic / Split:
 *    **intrinsic Code-Template** (legacy alias "JS ET"). The residual is a
 *    per-template compiled create() closure; no interpretation on the MT.
 *  - REGISTER_TREE + CLONE_TREE (16/17), addressedOr0 = 0 — Data / Dense /
 *    — / Split: **Named Tree** (legacy alias "dense tree" / A1). The
 *    residual is a lazy AST interpreted by one generic MT walker; every
 *    preorder slot is named.
 *  - REGISTER_TREE + CLONE_TREE, addressedOr0 = number[] — Data / Sparse /
 *    recovered / Split: **recovered Data-Template** (A2). Same residual and
 *    interpreter; only the compiler-recovered addressed closure is named.
 *  - Deployment lifetime (Durable vs Ephemeral) is not in the wire format:
 *    the same ops paint the durable BG-owned tree and the ephemeral IFR
 *    first-frame copy ("disposable" is that axis-D value, not a mechanism).
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
  INSERT_TEMPLATE_SLOT: 18,
  REMOVE_TEMPLATE_SLOT: 19,
  REGISTER_TREE_BUNDLE: 20,
  BIND_VAPOR_TEMPLATE: 21,
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
  [OP.REGISTER_TREE]: 3,
  [OP.CLONE_TREE]: 2,
  [OP.INSERT_TEMPLATE_SLOT]: 4,
  [OP.REMOVE_TEMPLATE_SLOT]: 3,
  [OP.REGISTER_TREE_BUNDLE]: 3,
  [OP.BIND_VAPOR_TEMPLATE]: 2,
});

// ---------------------------------------------------------------------------
// Element-template protocol (INSTANTIATE_TEMPLATE support)
// ---------------------------------------------------------------------------

/** Type-string prefix for compile-time-lowered template vnodes. */
export const TPL_TYPE_PREFIX = '__vlx-tpl:';
/** Prop-key prefix for hole bindings on lowered vnodes. */
export const TPL_HOLE_PREFIX = '__h';
/**
 * Hole-key marking an element slot (dynamic subtree insertion point).
 * Attr/text holes use the original prop key or `'#text'`; element slots use
 * this sentinel. Slot-index `k` is the k-th `TPL_SLOT_KEY` in the holes list
 * (0-based) and addresses INSERT/REMOVE_TEMPLATE_SLOT ops.
 */
export const TPL_SLOT_KEY = '#slot';
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

/**
 * MT bundle-seeded registry for build-time-parsed vapor structures (`+b!`,
 * #338): `globalThis.<name>(hash, structure)` at bundle evaluation.
 * REGISTER_TREE_BUNDLE resolves its hash here.
 */
export const VAPOR_STRUCTURE_REGISTER_GLOBAL = '__vueLynxRegisterVaporStructure';

/**
 * MT bundle-seeded registry for compiled vapor template `create()` functions
 * (`+b:c`, #337): `globalThis.<name>(hash, namedParents, create)` at bundle
 * evaluation. INSTANTIATE_TEMPLATE resolves vapor ids here (before the
 * element-template registry). `namedParents[i]` is the index (into the
 * addressed list) of the nearest NAMED ancestor of addressed slot `i`, or
 * -1 for the root — MT bookkeeping (insert tracking) mirrors the sparse
 * interpreter with it.
 */
export const VAPOR_TPL_REGISTER_GLOBAL = '__vueLynxRegisterVaporTemplate';

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

/**
 * Property stamped onto vapor `template()` factories by compile-time
 * addressing analysis (#297). Runtime sparse A2 (#298) reads this.
 */
export const VAPOR_ADDRESSING_KEY = '__vlxAddressing';

/**
 * Build-time define for the axis-B naming flag (#298 / #301 / #321).
 * Driven by `templateNaming: 'dense' | 'sparse'` in the plugin (the former
 * `enableSparseNaming` boolean is a deprecated alias). When `false`
 * (naming = dense), runtime forces dense CLONE_TREE — the **Named Tree**
 * cell — even if `__vlxAddressing` is present.
 */
export const VAPOR_SPARSE_NAMING_GLOBAL = '__VUE_LYNX_SPARSE_NAMING__';

/**
 * Sparse naming metadata for one vapor template (REGISTER_TREE preorder
 * slots). `addressed` is what receives uids under A2; `holes` ⊆ `addressed`
 * are write / insert-host targets.
 *
 * `tags` is a fingerprint of `addressed.map(slot => structure[slot].tag)` —
 * runtime validates these against `buildStructure` and fails safe to dense
 * A1 on any mismatch (guards against IR↔runtime preorder skew).
 */
export interface VaporTreeAddressing {
  holes: number[];
  addressed: number[];
  slotCount: number;
  /** Tags at each addressed slot, parallel to `addressed`. */
  tags: string[];
  /**
   * Fingerprint of the BUILD-TIME-parsed `TemplateNode` structure
   * (`hashVaporStructure(JSON.stringify(structure))`), stamped by the plugin
   * for the bundle-delivery (`+b!`, #338) and code-staging (`+b:c`, #337)
   * cells. The runtime compares it against the hash of its own
   * `buildStructure` output at first clone; only on an exact match may the
   * structure delivery be skipped (bundle) or the compiled `create()` be
   * instantiated (code) — any mismatch silently falls back to the wire
   * REGISTER_TREE data path.
   */
  hash?: string;
}

/**
 * Content hash for a serialized `TemplateNode` structure — the fingerprint
 * both build-time (plugin) and runtime (BG `buildStructure`) sides compute
 * over `JSON.stringify(structure)`. Same fnv1a×2 construction as the
 * element-template content ids. ONE definition shared by both sides so the
 * fail-safe can never drift by hashing differently.
 */
export function hashVaporStructure(structureJson: string): string {
  const fnv1a = (str: string, seed: number): number => {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  };
  return (
    fnv1a(structureJson, 0x811c9dc5).toString(36)
    + fnv1a(structureJson, 0x9747b28c).toString(36)
  );
}

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
