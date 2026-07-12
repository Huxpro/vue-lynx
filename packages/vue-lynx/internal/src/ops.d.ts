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
    readonly REGISTER_TEMPLATE: 15;
    readonly CLONE_TEMPLATE: 16;
};
export type OpCode = (typeof OP)[keyof typeof OP];
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
export declare const VAPOR_DOCUMENT_GLOBAL = "__VUE_LYNX_DOCUMENT__";
export declare const VAPOR_WINDOW_GLOBAL = "__VUE_LYNX_WINDOW__";
