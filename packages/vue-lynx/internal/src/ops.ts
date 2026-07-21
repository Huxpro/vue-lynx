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
 *   INSTANTIATE_TEMPLATE: [15, rootId, tplId, holeCount]
 *     Element-template instantiation (compile-time-lowered static subtree).
 *     The main thread builds the whole subtree via the registered create()
 *     function; the root maps to rootId and the template's holes (interior
 *     nodes with dynamic parts) map to rootId+1 … rootId+holeCount, so all
 *     later SET_* ops target them like ordinary elements.
 *   DEFINE_LIST_ITEM_TEMPLATE: [16, rootId, tplId, holeCount]
 *     Register a logical list-item backed by a compile-time element template.
 *     Unlike INSTANTIATE_TEMPLATE this does not create native elements. The
 *     list data-source adapter materializes a bounded number of cells when
 *     native invokes componentAtIndex and replays the latest root/hole state.
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
  INSTANTIATE_TEMPLATE: 15,
  DEFINE_LIST_ITEM_TEMPLATE: 16,
} as const;

export type OpCode = (typeof OP)[keyof typeof OP];

/**
 * Number of arguments following each opcode in the flat ops array — the
 * frame layout documented above, as data. Consumers that walk ops streams
 * without dispatching them (IFR hydration/teardown) rely on this table; keep
 * it in lockstep when adding an op.
 */
export const OP_ARITY: Record<OpCode, number> = {
  [OP.CREATE]: 2, // id, type
  [OP.CREATE_TEXT]: 1, // id
  [OP.INSERT]: 3, // parentId, childId, anchorId
  [OP.REMOVE]: 2, // parentId, childId
  [OP.SET_PROP]: 3, // id, key, value
  [OP.SET_TEXT]: 2, // id, text
  [OP.SET_EVENT]: 4, // id, eventType, eventName, sign
  [OP.REMOVE_EVENT]: 3, // id, eventType, eventName
  [OP.SET_STYLE]: 2, // id, styleObject
  [OP.SET_CLASS]: 2, // id, classString
  [OP.SET_ID]: 2, // id, idString
  [OP.SET_WORKLET_EVENT]: 4, // id, eventType, eventName, workletCtx
  [OP.SET_MT_REF]: 2, // id, refImpl
  [OP.INIT_MT_REF]: 2, // wvid, initValue
  [OP.SET_SCOPE_ID]: 2, // id, cssId
  [OP.INSTANTIATE_TEMPLATE]: 3, // rootId, tplId, holeCount
  [OP.DEFINE_LIST_ITEM_TEMPLATE]: 3, // rootId, tplId, holeCount
};

/**
 * The element id both threads assign to the page root. The BG renderer's
 * ShadowElement id space and the MT element registry must agree on it.
 */
export const PAGE_ROOT_ID = 1;

// ---------------------------------------------------------------------------
// Element-template protocol (INSTANTIATE_TEMPLATE support)
// ---------------------------------------------------------------------------

/** Type-string prefix for compile-time-lowered template vnodes. */
export const TPL_TYPE_PREFIX = '__vlx-tpl:';
/** Type-string prefix for lazily materialized list-item template vnodes. */
export const LIST_TPL_TYPE_PREFIX = '__vlx-list-tpl:';
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

/**
 * Convert a Vue scope ID (data-v-xxxxx) to a Lynx cssId (numeric).
 * Vue uses 8-char hex hash strings.  Lynx engine uses int32 for cssId,
 * so we mask to 0x7fffffff to stay within the positive int32 range.
 *
 * Cross-thread/compile-time contract: the BG runtime (SET_SCOPE_ID ops), the
 * compile-time element-template lowering (baked __SetCSSId calls), and the
 * scoped-CSS build plugin must all derive identical ids.
 */
export function scopeIdToCssId(scopeId: string): number {
  const hex = scopeId.replace(/^data-v-/, '');
  return Number.parseInt(hex, 16) & 0x7fffffff;
}
