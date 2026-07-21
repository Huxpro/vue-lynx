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
 *   DEFINE_LIST_ITEM_TEMPLATE: [16, rootId, tplId, holeCount]
 *     Element-template instantiation (compile-time-lowered static subtree).
 *     The main thread builds the whole subtree via the registered create()
 *     function; the root maps to rootId and the template's holes (interior
 *     nodes with dynamic parts) map to rootId+1 … rootId+holeCount, so all
 *     later SET_* ops target them like ordinary elements.
 */
export declare const OP: {
    readonly CREATE: 0;
    readonly CREATE_TEXT: 1;
    readonly INSERT: 2;
    readonly REMOVE: 3;
    readonly SET_PROP: 4;
    readonly SET_TEXT: 5;
    readonly SET_EVENT: 6;
    readonly REMOVE_EVENT: 7;
    readonly SET_STYLE: 8;
    readonly SET_CLASS: 9;
    readonly SET_ID: 10;
    readonly SET_WORKLET_EVENT: 11;
    readonly SET_MT_REF: 12;
    readonly INIT_MT_REF: 13;
    readonly SET_SCOPE_ID: 14;
    readonly INSTANTIATE_TEMPLATE: 15;
    readonly DEFINE_LIST_ITEM_TEMPLATE: 16;
};
export type OpCode = (typeof OP)[keyof typeof OP];
/**
 * Number of arguments following each opcode in the flat ops array — the
 * frame layout documented above, as data. Consumers that walk ops streams
 * without dispatching them (IFR hydration/teardown) rely on this table; keep
 * it in lockstep when adding an op.
 */
export declare const OP_ARITY: Record<OpCode, number>;
/**
 * The element id both threads assign to the page root. The BG renderer's
 * ShadowElement id space and the MT element registry must agree on it.
 */
export declare const PAGE_ROOT_ID = 1;
/** Type-string prefix for compile-time-lowered template vnodes. */
export declare const TPL_TYPE_PREFIX = "__vlx-tpl:";
export declare const LIST_TPL_TYPE_PREFIX = "__vlx-list-tpl:";
/** Prop-key prefix for hole bindings on lowered vnodes. */
export declare const TPL_HOLE_PREFIX = "__h";
/**
 * Name of the global through which compiler-generated code registers
 * element templates: `globalThis.<TPL_REGISTER_GLOBAL>(id, holes, create)`.
 * Referenced by compiler codegen, the loader that extracts registrations for
 * interpreter-only MT bundles, and the runtime/main-thread installers.
 */
export declare const TPL_REGISTER_GLOBAL = "__vueLynxRegisterElementTemplate";
/**
 * Convert a Vue scope ID (data-v-xxxxx) to a Lynx cssId (numeric).
 * Vue uses 8-char hex hash strings.  Lynx engine uses int32 for cssId,
 * so we mask to 0x7fffffff to stay within the positive int32 range.
 *
 * Cross-thread/compile-time contract: the BG runtime (SET_SCOPE_ID ops), the
 * compile-time element-template lowering (baked __SetCSSId calls), and the
 * scoped-CSS build plugin must all derive identical ids.
 */
export declare function scopeIdToCssId(scopeId: string): number;
