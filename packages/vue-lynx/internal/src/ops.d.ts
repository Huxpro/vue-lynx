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
};
export type OpCode = (typeof OP)[keyof typeof OP];
