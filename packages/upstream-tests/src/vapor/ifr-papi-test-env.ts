/**
 * Small, deterministic PAPI environment for the Node-only Vapor IFR tests.
 *
 * The production Main Thread owns opaque native element handles.  These tests
 * use plain objects instead, while preserving the contracts that matter to
 * `entry-main.ts` and `ops-apply.ts`: parent/child order, attributes, events,
 * unique ids, flushes, BG -> MT patch routing, and worklet-ref installation.
 */

export interface IfrPapiNode {
  readonly uid: number;
  readonly type: string;
  parent: IfrPapiNode | null;
  readonly children: IfrPapiNode[];
  readonly attrs: Record<string, unknown>;
  classes: string | string[];
  style: string | Record<string, unknown>;
  id: string | undefined;
  cssId: number | undefined;
  readonly events: Map<string, unknown>;
}

export interface WorkletRefUpdate {
  ref: unknown;
  element: IfrPapiNode;
}

export interface IfrPapiTestEnv {
  reset(): void;
  restore(): void;
  renderPage(data?: unknown): IfrPapiNode;
  patch(ops: unknown[]): void;
  root(): IfrPapiNode | null;
  queryAll(type: string): IfrPapiNode[];
  queryOne(type: string): IfrPapiNode | undefined;
  getEvent(
    node: IfrPapiNode,
    eventName: string,
    eventType?: string,
  ): unknown;
  dispatch(
    node: IfrPapiNode,
    eventName: string,
    data?: unknown,
    eventType?: string,
  ): void;
  readonly flushCount: number;
  readonly patchBatches: readonly unknown[][];
  readonly workletRefMap: Record<
    number,
    { current: unknown; _wvid: number }
  >;
  readonly workletRefUpdates: readonly WorkletRefUpdate[];
}

type PublishEvent = (sign: string, data: unknown) => void;

const PAPI_GLOBALS = [
  '__VUE_LYNX_FLUSH_HOOK__',
  '__VUE_LYNX_IFR_MT__',
  '__AddEvent',
  '__AppendElement',
  '__CreateElement',
  '__CreateImage',
  '__CreateList',
  '__CreatePage',
  '__CreateScrollView',
  '__CreateText',
  '__CreateView',
  '__FlushElementTree',
  '__GetElementUniqueID',
  '__InsertElementBefore',
  '__RemoveElement',
  '__SetAttribute',
  '__SetClasses',
  '__SetCSSId',
  '__SetID',
  '__SetInlineStyles',
  '__vueLynxIfrApplyOps',
  '__vueLynxIfrMountApps',
  'SystemInfo',
  'lynx',
  'lynxWorkletImpl',
  'processData',
  'renderPage',
  'runOnBackground',
  'updateGlobalProps',
  'updatePage',
  'vuePatchUpdate',
] as const;

function eventKey(eventType: string, eventName: string): string {
  return `${eventType}:${eventName}`;
}

function detach(node: IfrPapiNode): void {
  const parent = node.parent;
  if (!parent) return;
  const index = parent.children.indexOf(node);
  if (index >= 0) parent.children.splice(index, 1);
  node.parent = null;
}

/** Install the PAPI globals and return the observable test controller. */
export function createIfrPapiTestEnv(
  publishEvent: PublishEvent,
): IfrPapiTestEnv {
  const g = globalThis as Record<string, unknown>;
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const name of PAPI_GLOBALS) {
    originals.set(name, Object.getOwnPropertyDescriptor(g, name));
  }

  let nextUid = 1000;
  let page: IfrPapiNode | null = null;
  let flushes = 0;
  const patches: unknown[][] = [];
  const refMap: Record<number, { current: unknown; _wvid: number }> = {};
  const refUpdates: WorkletRefUpdate[] = [];

  const create = (type: string): IfrPapiNode => ({
    uid: nextUid++,
    type,
    parent: null,
    children: [],
    attrs: {},
    classes: '',
    style: {},
    id: undefined,
    cssId: undefined,
    events: new Map(),
  });

  const append = (parent: IfrPapiNode, child: IfrPapiNode): void => {
    detach(child);
    parent.children.push(child);
    child.parent = parent;
  };

  const insertBefore = (
    parent: IfrPapiNode,
    child: IfrPapiNode,
    anchor: IfrPapiNode,
  ): void => {
    detach(child);
    const index = parent.children.indexOf(anchor);
    if (index < 0) {
      parent.children.push(child);
    } else {
      parent.children.splice(index, 0, child);
    }
    child.parent = parent;
  };

  const install = (name: string, value: unknown): void => {
    Object.defineProperty(g, name, {
      configurable: true,
      enumerable: false,
      writable: true,
      value,
    });
  };

  install('__CreatePage', (_tag: string, _parentId: number) => {
    page = create('page');
    return page;
  });
  install('__CreateView', (_parentId: number) => create('view'));
  install('__CreateText', (_parentId: number) => create('text'));
  install('__CreateImage', (_parentId: number) => create('image'));
  install('__CreateScrollView', (_parentId: number) => create('scroll-view'));
  install('__CreateElement', (type: string, _parentId: number) => create(type));
  install('__CreateList', (_parentId: number) => create('list'));
  install('__GetElementUniqueID', (node: IfrPapiNode) => node.uid);
  install('__AppendElement', append);
  install('__InsertElementBefore', insertBefore);
  install('__RemoveElement', (parent: IfrPapiNode, child: IfrPapiNode) => {
    if (child.parent === parent) detach(child);
  });
  install(
    '__SetAttribute',
    (node: IfrPapiNode, key: string, value: unknown) => {
      node.attrs[key] = value;
    },
  );
  install(
    '__SetClasses',
    (node: IfrPapiNode, value: string | string[]) => {
      node.classes = value;
    },
  );
  install(
    '__SetInlineStyles',
    (node: IfrPapiNode, value: string | Record<string, unknown>) => {
      node.style = value;
    },
  );
  install('__SetID', (node: IfrPapiNode, value: string | undefined) => {
    node.id = value;
  });
  install('__SetCSSId', (nodes: IfrPapiNode[], value: number) => {
    for (const node of nodes) node.cssId = value;
  });
  install(
    '__AddEvent',
    (
      node: IfrPapiNode,
      eventType: string,
      eventName: string,
      listener: unknown,
    ) => {
      const key = eventKey(eventType, eventName);
      if (listener === undefined) node.events.delete(key);
      else node.events.set(key, listener);
    },
  );
  install('__FlushElementTree', () => {
    flushes++;
  });

  install('lynxWorkletImpl', {
    _refImpl: {
      _workletRefMap: refMap,
      updateWorkletRef(ref: unknown, element: IfrPapiNode): void {
        refUpdates.push({ ref, element });
        const descriptor = ref as { _wvid?: number };
        if (descriptor._wvid !== undefined) {
          refMap[descriptor._wvid] = {
            current: element,
            _wvid: descriptor._wvid,
          };
        }
      },
    },
  });

  install('lynx', {
    SystemInfo: { platform: 'ifr-papi-test' },
    getNativeApp() {
      return {
        callLepusMethod(
          method: string,
          params: { data: string },
          callback: () => void,
        ): void {
          if (method !== 'vuePatchUpdate') {
            throw new Error(`Unexpected Lepus method: ${method}`);
          }
          const ops = JSON.parse(params.data) as unknown[];
          patches.push(ops);
          const handler = g['vuePatchUpdate'] as
            | ((payload: { data: string }) => void)
            | undefined;
          if (!handler) {
            throw new Error('entry-main did not install vuePatchUpdate');
          }
          try {
            handler({ data: params.data });
          } finally {
            callback();
          }
        },
      };
    },
    getJSContext() {
      return {
        dispatchEvent(): void {},
        addEventListener(): void {},
      };
    },
  });

  const controller: IfrPapiTestEnv = {
    reset(): void {
      nextUid = 1000;
      page = null;
      flushes = 0;
      patches.length = 0;
      refUpdates.length = 0;
      for (const key of Object.keys(refMap)) delete refMap[Number(key)];
    },

    restore(): void {
      for (const [name, descriptor] of originals) {
        if (descriptor) Object.defineProperty(g, name, descriptor);
        else delete g[name];
      }
    },

    renderPage(data: unknown = {}): IfrPapiNode {
      const handler = g['renderPage'] as ((value: unknown) => void) | undefined;
      if (!handler) throw new Error('entry-main did not install renderPage');
      handler(data);
      if (!page) throw new Error('renderPage did not create a page root');
      return page;
    },

    patch(ops: unknown[]): void {
      patches.push([...ops]);
      const handler = g['vuePatchUpdate'] as
        | ((payload: { data: string }) => void)
        | undefined;
      if (!handler) throw new Error('entry-main did not install vuePatchUpdate');
      handler({ data: JSON.stringify(ops) });
    },

    root(): IfrPapiNode | null {
      return page;
    },

    queryAll(type: string): IfrPapiNode[] {
      if (!page) return [];
      const result: IfrPapiNode[] = [];
      const stack = [...page.children].reverse();
      while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.type === type) result.push(node);
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i]!);
        }
      }
      return result;
    },

    queryOne(type: string): IfrPapiNode | undefined {
      return controller.queryAll(type)[0];
    },

    getEvent(
      node: IfrPapiNode,
      eventName: string,
      eventType = 'bindEvent',
    ): unknown {
      return node.events.get(eventKey(eventType, eventName));
    },

    dispatch(
      node: IfrPapiNode,
      eventName: string,
      data: unknown = {},
      eventType = 'bindEvent',
    ): void {
      const listener = controller.getEvent(node, eventName, eventType);
      if (typeof listener !== 'string') {
        throw new Error(
          `Expected an event sign for ${eventType}:${eventName}, got ${String(listener)}`,
        );
      }
      publishEvent(listener, data);
    },

    get flushCount(): number {
      return flushes;
    },

    get patchBatches(): readonly unknown[][] {
      return patches;
    },

    get workletRefMap() {
      return refMap;
    },

    get workletRefUpdates(): readonly WorkletRefUpdate[] {
      return refUpdates;
    },
  };

  return controller;
}
