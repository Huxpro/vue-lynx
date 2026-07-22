/**
 * Production IFR protocol tests for the pure Vapor entry.
 *
 * The suite intentionally runs both logical realms in one Node isolate.  A
 * `resetForTesting()` between the MT and BG mounts models the fresh runtime
 * module state each Lynx realm receives; the Main Thread PAPI registry is not
 * reset, because that is the state hydration must adopt or replace.
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import * as runtimeCore from '@vue/runtime-core';
import { resetForTesting } from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import {
  child,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  on,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  renderEffect,
  setText,
  template,
  txt,
} from 'vue-lynx/vapor';
import { publishEvent } from '../../../vue-lynx/runtime/src/event-registry.js';
import {
  scheduleFlush,
  waitForFlush,
} from '../../../vue-lynx/runtime/src/flush.js';
import { pushOp } from '../../../vue-lynx/runtime/src/ops.js';
import { resetMainThreadState } from '../../../vue-lynx/main-thread/src/ops-apply.js';
import {
  createIfrPapiTestEnv,
  type IfrPapiNode,
  type IfrPapiTestEnv,
} from './ifr-papi-test-env.js';

type IfrPhase = 'inactive' | 'enabled' | 'rendered' | 'hydrated';

interface IfrApi {
  completeIfrHydration(): void;
  enableIFR(): void;
  getIfrPhase(): IfrPhase;
  resetIfrForTesting(): void;
  sealIfrRender(): void;
}

const globals = globalThis as Record<string, unknown>;

let papi: IfrPapiTestEnv;
let ifrApi: IfrApi | undefined;
let ifrLoadError: unknown;

beforeAll(async () => {
  // entry-main reads the PAPI globals only when its lifecycle functions run,
  // but installing first also verifies its SystemInfo bootstrap path.
  papi = createIfrPapiTestEnv(publishEvent);
  await import('../../../vue-lynx/main-thread/src/entry-main.js');

  // Keep the entire suite runnable before Task 4 creates ifr.ts.  Each IFR
  // assertion then fails with one explicit product precondition instead of a
  // Vite module-resolution error that would hide fixture mistakes.
  const ifrModule = '../../../vue-lynx/main-thread/src/ifr.js';
  try {
    ifrApi = await import(/* @vite-ignore */ ifrModule) as IfrApi;
  } catch (error) {
    ifrLoadError = error;
  }
});

afterAll(() => {
  papi.restore();
});

beforeEach(() => {
  vi.restoreAllMocks();
  ifrApi?.resetIfrForTesting();
  resetForTesting();
  resetMainThreadState();
  papi.reset();
  delete globals['__VUE_LYNX_IFR_MT__'];
  delete globals['__vueLynxIfrApplyOps'];
  delete globals['__vueLynxIfrMountApps'];
  delete globals['__VUE_LYNX_FLUSH_HOOK__'];
});

function ifr(): IfrApi {
  if (!ifrApi) {
    const detail = ifrLoadError instanceof Error
      ? `: ${ifrLoadError.message}`
      : '';
    throw new Error(
      `Vapor IFR API is not implemented (expected main-thread/src/ifr.ts)${detail}`,
    );
  }
  return ifrApi;
}

function localSink(): (ops: unknown[]) => void {
  const sink = globals['__vueLynxIfrApplyOps'];
  if (typeof sink !== 'function') {
    throw new Error('enableIFR() did not install __vueLynxIfrApplyOps');
  }
  return sink as (ops: unknown[]) => void;
}

function selectorAttrs(node: IfrPapiNode | undefined): string[] {
  if (!node) return [];
  return Object.keys(node.attrs).filter((key) => key.startsWith('vue-ref-'));
}

/** Render one or more synthetic MT flushes synchronously inside renderPage. */
function renderMtOps(...batches: unknown[][]): void {
  ifr().enableIFR();
  globals['__vueLynxIfrMountApps'] = () => {
    const apply = localSink();
    for (const batch of batches) apply(batch);
  };
  papi.renderPage();
  expect(ifr().getIfrPhase()).toBe('rendered');
}

interface CounterRealm {
  value: number;
}

function makeCounterApp(
  realms: CounterRealm[],
  mounted?: () => void,
) {
  return defineVaporComponent(() => {
    // Production MT and BG bundles evaluate compiler-hoisted template()
    // declarations in separate realms. Creating the closure per setup makes
    // these reset-and-remount tests model that fresh module evaluation rather
    // than accidentally reusing one realm's parsed prototype after reset.
    const clone = template('<view class=counter><text> ', 1);
    const count = ref(0);
    realms.push(count);
    if (mounted) onMounted(mounted);

    const root = clone() as IfrPapiNode;
    const label = child(root) as IfrPapiNode;
    const labelText = txt(label) as IfrPapiNode;
    renderEffect(() => setText(labelText, `count:${count.value}`));
    on(root, 'tap', () => count.value++);
    return root;
  });
}

/** Mount the app in the IFR realm, then synchronously enter renderPage. */
type VaporRootComponent = Parameters<typeof createVaporApp>[0];
type VaporApp = ReturnType<typeof createVaporApp>;

async function renderVaporFirstFrame(app: VaporRootComponent) {
  ifr().enableIFR();
  createVaporApp(app).mount();

  // Deferral is observable even after the current scheduler turn drains.
  await nextTick();
  expect(papi.root()).toBeNull();
  expect(papi.patchBatches).toHaveLength(0);

  const page = papi.renderPage();
  expect(ifr().getIfrPhase()).toBe('rendered');
  return page;
}

/** Boot a fresh BG runtime and deliver its normal flush to vuePatchUpdate. */
async function hydrateVapor(app: VaporRootComponent): Promise<VaporApp> {
  delete globals['__VUE_LYNX_IFR_MT__'];
  resetForTesting();
  const instance = createVaporApp(app);
  instance.mount();
  await nextTick();
  return instance;
}

describe('Vapor IFR first frame and lifecycle ownership', () => {
  it('defers mount and paints synchronously inside renderPage', async () => {
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms);

    const page = await renderVaporFirstFrame(App);

    expect(page.children).toHaveLength(1);
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('text')).toHaveLength(1);
    expect(papi.queryOne('text')?.attrs['text']).toBe('count:0');
    expect(papi.flushCount).toBeGreaterThan(0);
  });

  it('defers BG NodesRef selector attributes during renderPage', async () => {
    const App = makeCounterApp([]);

    await renderVaporFirstFrame(App);

    expect(selectorAttrs(papi.queryOne('view'))).toEqual([]);
    expect(selectorAttrs(papi.queryOne('text'))).toEqual([]);
  });

  it('suppresses MT onMounted and runs it exactly once on BG', async () => {
    const mounted = vi.fn();
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms, mounted);

    await renderVaporFirstFrame(App);
    expect(mounted).not.toHaveBeenCalled();

    await hydrateVapor(App);
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(ifr().getIfrPhase()).toBe('hydrated');
  });
});

type LifecycleSlot = 'bm' | 'm' | 'bu' | 'u' | 'bum' | 'um' | 'a' | 'da';
type LifecycleTrigger = 'mount' | 'update' | 'unmount' | 'invoke-slot';
type LifecycleRegistrar = (callback: () => void) => void;

interface LifecycleInstance {
  bm?: Array<() => void>;
  m?: Array<() => void>;
  bu?: Array<() => void>;
  u?: Array<() => void>;
  bum?: Array<() => void>;
  um?: Array<() => void>;
  a?: Array<() => void>;
  da?: Array<() => void>;
}

const lifecycleCases: ReadonlyArray<{
  name: string;
  register: LifecycleRegistrar;
  slot: LifecycleSlot;
  trigger: LifecycleTrigger;
}> = [
  {
    name: 'onBeforeMount',
    register: onBeforeMount,
    slot: 'bm',
    trigger: 'mount',
  },
  { name: 'onMounted', register: onMounted, slot: 'm', trigger: 'mount' },
  {
    name: 'onBeforeUpdate',
    register: onBeforeUpdate,
    slot: 'bu',
    trigger: 'update',
  },
  { name: 'onUpdated', register: onUpdated, slot: 'u', trigger: 'update' },
  {
    name: 'onBeforeUnmount',
    register: onBeforeUnmount,
    slot: 'bum',
    trigger: 'unmount',
  },
  {
    name: 'onUnmounted',
    register: onUnmounted,
    slot: 'um',
    trigger: 'unmount',
  },
  {
    name: 'onActivated',
    register: onActivated,
    slot: 'a',
    trigger: 'invoke-slot',
  },
  {
    name: 'onDeactivated',
    register: onDeactivated,
    slot: 'da',
    trigger: 'invoke-slot',
  },
];

function makeLifecycleApp(
  register: LifecycleRegistrar,
  callback: () => void,
  realms: CounterRealm[],
  instances: LifecycleInstance[],
) {
  return defineVaporComponent((_props, instanceContext) => {
    const clone = template('<view class=lifecycle><text> ', 1);
    const state = ref(0);
    realms.push(state);
    register(callback);
    instances.push(
      instanceContext as unknown as LifecycleInstance,
    );

    const root = clone() as IfrPapiNode;
    const label = child(root) as IfrPapiNode;
    const labelText = txt(label) as IfrPapiNode;
    renderEffect(() => setText(labelText, `lifecycle:${state.value}`));
    return root;
  });
}

describe('Vapor IFR lifecycle export matrix', () => {
  it.each(lifecycleCases)(
    'keeps $name inert on MT and registers/runs it once on BG',
    async ({ register, slot, trigger }) => {
      const callback = vi.fn();
      const realms: CounterRealm[] = [];
      const instances: LifecycleInstance[] = [];
      const App = makeLifecycleApp(register, callback, realms, instances);

      await renderVaporFirstFrame(App);
      expect(callback).not.toHaveBeenCalled();
      expect(instances[0]?.[slot]).toBeFalsy();

      const bgApp = await hydrateVapor(App);
      expect(instances[1]?.[slot]).toHaveLength(1);

      if (trigger === 'update') {
        realms[1]!.value++;
        await nextTick();
      } else if (trigger === 'unmount') {
        bgApp.unmount();
        await nextTick();
      } else if (trigger === 'invoke-slot') {
        // Vue Lynx does not expose Vapor KeepAlive yet. The runtime-core hook
        // is nevertheless registered in the same instance slot KeepAlive
        // invokes, so exercise that BG-owned slot directly.
        instances[1]![slot]![0]!();
      }

      expect(callback).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps onErrorCaptured as the unsuppressed runtime-core export', () => {
    expect(onErrorCaptured).toBe(runtimeCore.onErrorCaptured);
  });
});

async function expectNoPendingFlushAck(): Promise<void> {
  let resolved = false;
  void waitForFlush().then(() => {
    resolved = true;
  });
  await Promise.resolve();
  expect(resolved).toBe(true);
}

describe('Vapor IFR local flush transport', () => {
  it('runs the observability hook before the local sink without IPC or an ack', async () => {
    const batch = [OP.SET_TEXT, 1, 'local-first-frame'];
    const order: string[] = [];
    const lynxStub = globals['lynx'] as { getNativeApp(): unknown };
    const getNativeApp = vi.spyOn(lynxStub, 'getNativeApp');

    ifr().enableIFR();
    globals['__VUE_LYNX_FLUSH_HOOK__'] = (
      ops: unknown[],
      serialized: string,
    ) => {
      order.push('hook');
      expect(ops).toEqual(batch);
      expect(serialized).toBe(JSON.stringify(batch));
    };
    globals['__vueLynxIfrApplyOps'] = (ops: unknown[]) => {
      order.push('sink');
      expect(ops).toEqual(batch);
    };

    pushOp(...batch);
    scheduleFlush();
    await runtimeCore.nextTick();

    expect(order).toEqual(['hook', 'sink']);
    expect(getNativeApp).not.toHaveBeenCalled();
    expect(papi.patchBatches).toHaveLength(0);
    await expectNoPendingFlushAck();
  });

  it('still observes and drops a local batch when the sink is missing', async () => {
    const batch = [OP.SET_TEXT, 1, 'missing-sink'];
    const hook = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const lynxStub = globals['lynx'] as { getNativeApp(): unknown };
    const getNativeApp = vi.spyOn(lynxStub, 'getNativeApp');

    ifr().enableIFR();
    delete globals['__vueLynxIfrApplyOps'];
    globals['__VUE_LYNX_FLUSH_HOOK__'] = hook;

    pushOp(...batch);
    scheduleFlush();
    await runtimeCore.nextTick();

    expect(hook).toHaveBeenCalledOnce();
    expect(hook).toHaveBeenCalledWith(batch, JSON.stringify(batch));
    expect(warn).toHaveBeenCalledOnce();
    expect(getNativeApp).not.toHaveBeenCalled();
    expect(papi.patchBatches).toHaveLength(0);
    await expectNoPendingFlushAck();
  });
});

describe('Vapor IFR hydration ownership', () => {
  it('commits deferred selector attributes before identical BG adoption completes', async () => {
    const App = makeCounterApp([]);
    await renderVaporFirstFrame(App);
    const view = papi.queryOne('view')!;
    const text = papi.queryOne('text')!;
    const firstFrameFlushes = papi.flushCount;

    await hydrateVapor(App);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(selectorAttrs(view)).toEqual([expect.stringMatching(/^vue-ref-\d+$/)]);
    expect(selectorAttrs(text)).toEqual([expect.stringMatching(/^vue-ref-\d+$/)]);
    expect(papi.flushCount).toBeGreaterThan(firstFrameFlushes);
  });

  it('skips an identical REGISTER_TREE/CLONE_TREE stream without duplication', async () => {
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms);
    await renderVaporFirstFrame(App);
    const firstView = papi.queryOne('view');
    const firstText = papi.queryOne('text');

    await hydrateVapor(App);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toEqual([firstView]);
    expect(papi.queryAll('text')).toEqual([firstText]);
    expect(papi.root()?.children).toHaveLength(1);
  });

  it('routes the deterministic MT-bound event sign to the BG handler', async () => {
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms);
    await renderVaporFirstFrame(App);
    await hydrateVapor(App);

    const view = papi.queryOne('view')!;
    expect(papi.getEvent(view, 'tap')).toBe('vue:0');
    papi.dispatch(view, 'tap');
    await nextTick();

    expect(realms).toHaveLength(2);
    expect(realms[1]!.value).toBe(1);
    expect(papi.queryOne('text')?.attrs['text']).toBe('count:1');
  });

  it('applies normal BG reactive updates after hydration', async () => {
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms);
    await renderVaporFirstFrame(App);
    await hydrateVapor(App);

    realms[1]!.value = 7;
    await nextTick();

    expect(papi.queryOne('text')?.attrs['text']).toBe('count:7');
    expect(papi.queryAll('text')).toHaveLength(1);
  });

  it('drops MT-produced ops after hydration', () => {
    const initial = [
      OP.CREATE,
      2,
      'text',
      OP.SET_TEXT,
      2,
      'authoritative',
      OP.INSERT,
      1,
      2,
      -1,
    ];
    renderMtOps(initial);
    papi.patch(initial);
    expect(ifr().getIfrPhase()).toBe('hydrated');

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const flushes = papi.flushCount;
    localSink()([OP.SET_TEXT, 2, 'stale-main-thread']);
    localSink()([OP.SET_TEXT, 2, 'still-stale']);

    expect(papi.queryOne('text')?.attrs['text']).toBe('authoritative');
    expect(papi.flushCount).toBe(flushes);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('patches text and style values in place', () => {
    const mt = [
      OP.CREATE,
      2,
      'view',
      OP.SET_STYLE,
      2,
      { color: 'red' },
      OP.CREATE_TEXT,
      3,
      OP.SET_TEXT,
      3,
      'from-main',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bg = [
      OP.CREATE,
      2,
      'view',
      OP.SET_STYLE,
      2,
      { color: 'blue' },
      OP.CREATE_TEXT,
      3,
      OP.SET_TEXT,
      3,
      'from-background',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(mt);
    const view = papi.queryOne('view');
    const text = papi.queryOne('text');
    papi.patch(bg);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryOne('view')).toBe(view);
    expect(papi.queryOne('text')).toBe(text);
    expect(view?.style).toEqual({ color: 'blue' });
    expect(text?.attrs['text']).toBe('from-background');
  });

  it('replays BG worklet contexts and MainThreadRef bindings authoritatively', () => {
    const mtContext = { _wkltId: 'handler', _execId: 'mt' };
    const bgContext = { _wkltId: 'handler', _execId: 'bg' };
    const mtRef = { _wvid: 7, _initValue: null, owner: 'mt' };
    const bgRef = { _wvid: 7, _initValue: null, owner: 'bg' };
    const mt = [
      OP.CREATE,
      2,
      'view',
      OP.SET_WORKLET_EVENT,
      2,
      'bindEvent',
      'tap',
      mtContext,
      OP.INIT_MT_REF,
      7,
      null,
      OP.SET_MT_REF,
      2,
      mtRef,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bg = [
      OP.CREATE,
      2,
      'view',
      OP.SET_WORKLET_EVENT,
      2,
      'bindEvent',
      'tap',
      bgContext,
      OP.INIT_MT_REF,
      7,
      null,
      OP.SET_MT_REF,
      2,
      bgRef,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(mt);
    const view = papi.queryOne('view')!;
    expect(papi.workletRefUpdates.at(-1)?.ref).toBe(mtRef);
    papi.patch(bg);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toEqual([view]);
    expect(papi.getEvent(view, 'tap')).toEqual({
      type: 'worklet',
      value: expect.objectContaining({
        _execId: 'bg',
        _workletType: 'main-thread',
      }),
    });
    // vuePatchUpdate is a JSON transport, so the MT receives a deserialized
    // BG descriptor rather than the BG object's JavaScript identity. Assert
    // semantic BG ownership and explicitly reject reuse of the MT descriptor.
    const appliedRef = papi.workletRefUpdates.at(-1)?.ref;
    expect(appliedRef).toEqual(bgRef);
    expect(appliedRef).not.toBe(mtRef);
    expect(papi.workletRefMap[7]?.current).toBe(view);
  });

  it('overwrites an MT-mutated MainThreadRef with the BG initial value', () => {
    // INIT_MT_REF is replayed 'always' with BG as the authority: a worklet
    // that wrote into the ref during the pre-hydration window (e.g. a scroll
    // offset) is deliberately reset to the deterministic initial value. This
    // trades interaction state captured in that narrow window for a single
    // unambiguous owner; a design change here must update VALUE_OP and
    // applyInitMtRef together.
    const frame = [OP.CREATE, 2, 'view', OP.INIT_MT_REF, 9, 'init', OP.INSERT, 1, 2, -1];

    renderMtOps(frame);
    expect(papi.workletRefMap[9]?.current).toBe('init');
    const entry = papi.workletRefMap[9]!;
    entry.current = 'mt-mutated';

    papi.patch([...frame]);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    // The registry entry object is preserved (worklet-runtime may hold it)…
    expect(papi.workletRefMap[9]).toBe(entry);
    // …but its value is the replayed BG payload, not the MT mutation.
    expect(papi.workletRefMap[9]?.current).toBe('init');
  });
});

describe('Vapor IFR correctness fallbacks', () => {
  it('replays a structural fallback with selector attributes enabled', () => {
    const mt = [
      OP.CREATE,
      2,
      'view',
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bg = [
      OP.CREATE_TEXT,
      2,
      OP.SET_TEXT,
      2,
      'background',
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(mt);
    expect(selectorAttrs(papi.queryOne('view'))).toEqual([]);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    papi.patch(bg);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(0);
    expect(selectorAttrs(papi.queryOne('text'))).toEqual([
      expect.stringMatching(/^vue-ref-\d+$/),
    ]);
  });

  it('clears the Vapor template registry before replaying a mismatched clone stream', () => {
    const mtStructure = [
      'view',
      0,
      [['text', { t: 'main template' }, []]],
    ];
    const bgStructure = [
      'view',
      { c: 'background-card' },
      [['image', { a: [['src', 'template-bg.png']] }, []]],
    ];
    const mt = [
      OP.REGISTER_TREE,
      1,
      mtStructure,
      0,
      OP.CLONE_TREE,
      1,
      2,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bg = [
      OP.REGISTER_TREE,
      1,
      bgStructure,
      0,
      OP.CLONE_TREE,
      1,
      2,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(mt);
    expect(papi.queryAll('text')).toHaveLength(1);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    papi.patch(bg);

    // applyOps has a duplicate-batch guard for REGISTER_TREE.  Fallback
    // must reset that registry (and then reseed page id 1), otherwise the BG
    // replay is silently skipped at its first opcode.
    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('text')).toHaveLength(0);
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryOne('view')?.classes).toBe('background-card');
    expect(papi.queryAll('image')).toHaveLength(1);
    expect(papi.queryOne('image')?.attrs['src']).toBe('template-bg.png');
    expect(papi.root()?.children).toHaveLength(1);
  });

  it('tears down and replays a structurally different BG tree', () => {
    const mt = [
      OP.CREATE,
      2,
      'view',
      OP.CREATE_TEXT,
      3,
      OP.SET_TEXT,
      3,
      'main',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bg = [
      OP.CREATE,
      2,
      'view',
      OP.CREATE,
      3,
      'image',
      OP.SET_PROP,
      3,
      'src',
      'bg.png',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(mt);
    const oldView = papi.queryOne('view');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    papi.patch(bg);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryOne('view')).not.toBe(oldView);
    expect(papi.queryAll('text')).toHaveLength(0);
    expect(papi.queryAll('image')).toHaveLength(1);
    expect(papi.queryOne('image')?.attrs['src']).toBe('bg.png');
  });

  it('rebuilds from the buffered history when an in-place patch throws', () => {
    const make = (color: string) => [
      OP.CREATE,
      2,
      'view',
      OP.SET_STYLE,
      2,
      { color },
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(make('red'));

    // First native style write after the paint throws (e.g. a host rejecting
    // a value); the replayed history afterwards applies normally.
    const setStyles = globals['__SetInlineStyles'] as (
      ...args: unknown[]
    ) => unknown;
    let throwOnce = true;
    globals['__SetInlineStyles'] = (...args: unknown[]) => {
      if (throwOnce) {
        throwOnce = false;
        throw new Error('native style rejection');
      }
      return setStyles(...args);
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // A differing style value forces an in-place patch — vuePatchUpdate
      // must not throw even though the patch write does.
      expect(() => papi.patch(make('blue'))).not.toThrow();
    } finally {
      globals['__SetInlineStyles'] = setStyles;
    }

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('IFR hydration patch failed'),
      expect.any(Error),
    );
    expect(ifr().getIfrPhase()).toBe('hydrated');
    // The tree was rebuilt from the authoritative BG history.
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryOne('view')?.style).toEqual({ color: 'blue' });
  });

  it('rebuilds list metadata when a BG platform-info value differs', () => {
    const makeList = (itemKey: string) => [
      OP.CREATE,
      2,
      'list',
      OP.CREATE,
      3,
      'view',
      OP.SET_PROP,
      3,
      'item-key',
      itemKey,
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    renderMtOps(makeList('main'));
    const firstList = papi.queryOne('list');
    expect(firstList?.attrs['update-list-info']).toMatchObject({
      insertAction: [{ 'item-key': 'main' }],
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    papi.patch(makeList('background'));

    const adoptedList = papi.queryOne('list');
    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(adoptedList).not.toBe(firstList);
    expect(adoptedList?.attrs['update-list-info']).toMatchObject({
      insertAction: [{ 'item-key': 'background' }],
    });
    expect(papi.queryAll('list')).toHaveLength(1);
  });

  it('catches an MT render exception and lets the BG render normally', () => {
    ifr().enableIFR();
    globals['__vueLynxIfrMountApps'] = () => {
      localSink()([
        OP.CREATE,
        2,
        'view',
        OP.INSERT,
        1,
        2,
        -1,
      ]);
      throw new Error('intentional first-frame failure');
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => papi.renderPage()).not.toThrow();
    expect(ifr().getIfrPhase()).toBe('hydrated');

    papi.patch([
      OP.CREATE,
      2,
      'text',
      OP.SET_TEXT,
      2,
      'background fallback',
      OP.INSERT,
      1,
      2,
      -1,
    ]);
    expect(papi.queryAll('view')).toHaveLength(0);
    expect(papi.queryAll('text')).toHaveLength(1);
    expect(papi.queryOne('text')?.attrs['text']).toBe('background fallback');
  });
});

describe('Vapor IFR flattened frame-stream hydration', () => {
  const firstFrames = [
    OP.CREATE,
    2,
    'view',
    OP.SET_CLASS,
    2,
    'card',
  ];
  const remainingFrames = [
    OP.CREATE_TEXT,
    3,
    OP.SET_TEXT,
    3,
    'ready',
    OP.INSERT,
    2,
    3,
    -1,
    OP.INSERT,
    1,
    2,
    -1,
  ];

  it('accepts one MT flush split across multiple BG batches', () => {
    renderMtOps([...firstFrames, ...remainingFrames]);

    papi.patch(firstFrames);
    expect(ifr().getIfrPhase()).toBe('rendered');
    papi.patch(remainingFrames);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('text')).toHaveLength(1);
  });

  it('accepts multiple MT flushes coalesced into one BG batch', () => {
    renderMtOps(firstFrames, remainingFrames);

    papi.patch([...firstFrames, ...remainingFrames]);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('text')).toHaveLength(1);
  });

  it('replays all buffered BG history when a later batch mismatches', () => {
    const mtTail = [
      OP.CREATE_TEXT,
      3,
      OP.SET_TEXT,
      3,
      'main',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const bgTail = [
      OP.CREATE,
      3,
      'image',
      OP.SET_PROP,
      3,
      'src',
      'late.png',
      OP.INSERT,
      2,
      3,
      -1,
      OP.INSERT,
      1,
      2,
      -1,
    ];
    renderMtOps([...firstFrames, ...mtTail]);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // This prefix is consumed without applying it because the IFR tree
    // already contains it.  A later mismatch must replay this prefix too.
    papi.patch(firstFrames);
    expect(ifr().getIfrPhase()).toBe('rendered');
    papi.patch(bgTail);

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('image')).toHaveLength(1);
    expect(papi.queryOne('image')?.attrs['src']).toBe('late.png');
    expect(papi.root()?.children[0]).toBe(papi.queryOne('view'));
    expect(papi.queryOne('view')?.children[0]).toBe(papi.queryOne('image'));
  });

  it('removes an unmatched MT tail when BG signals its initial render is complete', () => {
    const bg = [
      OP.CREATE,
      2,
      'view',
      OP.INSERT,
      1,
      2,
      -1,
    ];
    const mtOnlyTail = [
      OP.CREATE,
      3,
      'image',
      OP.SET_PROP,
      3,
      'src',
      'mt-only.png',
      OP.INSERT,
      2,
      3,
      -1,
    ];

    renderMtOps([...bg, ...mtOnlyTail]);
    ifr().sealIfrRender();
    papi.patch(bg);

    expect(ifr().getIfrPhase()).toBe('rendered');
    expect(papi.queryAll('image')).toHaveLength(1);

    // No later BG batch exists. The explicit end signal must distinguish a
    // complete strict prefix from a batch split and rebuild from BG history.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    ifr().completeIfrHydration();

    expect(ifr().getIfrPhase()).toBe('hydrated');
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('image')).toHaveLength(0);
    expect(papi.root()?.children).toHaveLength(1);
  });

  it('drops MT effects after the initial stream is sealed while BG is incomplete', () => {
    renderMtOps([
      OP.CREATE,
      2,
      'text',
      OP.SET_TEXT,
      2,
      'first frame',
      OP.INSERT,
      1,
      2,
      -1,
    ]);
    ifr().sealIfrRender();

    localSink()([OP.SET_TEXT, 2, 'must be dropped']);

    expect(ifr().getIfrPhase()).toBe('rendered');
    expect(papi.queryOne('text')?.attrs['text']).toBe('first frame');
  });
});

describe('non-IFR regression', () => {
  it('keeps renderPage empty until the normal BG mount flushes once', async () => {
    const realms: CounterRealm[] = [];
    const App = makeCounterApp(realms);

    const page = papi.renderPage();
    expect(page.children).toHaveLength(0);
    expect(papi.patchBatches).toHaveLength(0);

    createVaporApp(App).mount();
    await nextTick();

    // Vapor may flush the container-clear op separately from the template
    // clone.  The regression contract is that every normal BG batch is
    // handled once and yields one tree, not that mount has one scheduler
    // batch on every runtime-vapor release.
    expect(papi.patchBatches.length).toBeGreaterThan(0);
    expect(papi.queryAll('view')).toHaveLength(1);
    expect(papi.queryAll('text')).toHaveLength(1);
    expect(papi.queryOne('text')?.attrs['text']).toBe('count:0');
  });

  it('drops a duplicate Vapor batch when value/ref frames precede its first allocator', () => {
    const structure = [
      'view',
      { c: 'single-instance' },
      [['text', { t: 'only once' }, []]],
    ];
    const allocatorTail = [
      OP.REGISTER_TREE,
      77,
      structure,
      0,
      OP.CLONE_TREE,
      77,
      2,
      OP.INSERT,
      1,
      2,
      -1,
    ];

    const page = papi.renderPage();
    papi.patch([
      OP.SET_TEXT,
      1,
      'first-prefix',
      OP.INIT_MT_REF,
      9,
      'first-ref',
      ...allocatorTail,
    ]);
    const firstView = papi.queryOne('view');
    const firstText = papi.queryOne('text');
    const flushes = papi.flushCount;
    expect(page.attrs['text']).toBe('first-prefix');

    papi.patch([
      OP.SET_TEXT,
      1,
      'duplicate-prefix-must-not-run',
      OP.INIT_MT_REF,
      9,
      'duplicate-ref',
      ...allocatorTail,
    ]);

    expect(page.attrs['text']).toBe('first-prefix');
    expect(papi.flushCount).toBe(flushes);
    expect(papi.queryAll('view')).toEqual([firstView]);
    expect(papi.queryAll('text')).toEqual([firstText]);
    expect(page.children).toHaveLength(1);
  });
});
