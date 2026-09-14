export const NATIVE_TABLE_PROTOCOL = 'lynx-native-bench-v3' as const;
export const NATIVE_STARTUP_PROTOCOL = 'lynx-native-startup-v2' as const;
export const NATIVE_STARTUP_TIMING_FLAG = 'lynx-native-bench-startup' as const;

export interface BenchmarkSnapshot {
  rowCount: number;
  firstId: number | null;
  secondId: number | null;
  thirdId: number | null;
  row998Id: number | null;
  firstLabel: string | null;
  selectedId: number | null;
}

export interface StormEvidence {
  expectedTicks: number;
  completedTicks: number;
  renderBarriers: number;
  hostCommitBarriers: number;
  transportEvidence: StormHostCommitEvidence;
}

export interface StartupObservation {
  protocol: typeof NATIVE_STARTUP_PROTOCOL;
  moduleStartMs: number;
  commitAckMs?: number;
  firstFrameMs?: number;
  secondFrameMs?: number;
  transportEvidence?: HostCommitEvidence;
  renderEvidence: {
    kind: 'native-animation-frame';
    frames: 2;
  };
  postState?: BenchmarkSnapshot;
}

interface BenchmarkGlobal {
  __LYNX_BENCH_SNAPSHOT__?: () => BenchmarkSnapshot;
  __LYNX_BENCH_STARTUP__?: StartupObservation;
  __VUE_LYNX_IFR_ENABLED__?: boolean;
}

export type HostCommitMethod =
  | 'rLynxChange'
  | 'rLynxElementTemplateUpdate'
  | 'vuePatchUpdate'
  | 'vueIfrHydrationComplete';

export interface HostCommitEvidence {
  kind: 'framework-host-commit-callback';
  method: HostCommitMethod;
  acknowledged: true;
  acknowledgedAtMs: number;
}

export interface StormHostCommitEvidence {
  kind: 'per-tick-framework-host-commit-callbacks';
  methods: HostCommitMethod[];
  acknowledged: true;
  count: number;
  lastAcknowledgedAtMs: number;
}

export interface HostCommitWait {
  promise: Promise<HostCommitEvidence>;
  cancel(): void;
}

export interface NativeBenchmarkRuntime {
  native: boolean;
  globalObject: BenchmarkGlobal;
  now(): number;
  requestAnimationFrame(callback: () => void): void;
  setTimeout(callback: () => void): void;
  report(marker: string, payload: string): void;
  armHostCommit(methods?: readonly HostCommitMethod[]): HostCommitWait;
}

type ActionResult = void | Promise<StormEvidence>;

interface NativeAppLike {
  callLepusMethod(
    method: string,
    params: unknown,
    callback?: (...args: unknown[]) => void
  ): void;
}

interface NativeLynxLike {
  getNativeApp(): NativeAppLike | null | undefined;
}

interface NativeContextLike {
  dispatchEvent(event: { type: string; data: unknown }): unknown;
  addEventListener(
    type: string,
    listener: (event: { type: string; data: unknown }) => void
  ): void;
}

type InstallHostCommitInterceptor = (
  app: NativeAppLike,
  callLepusMethod: NativeAppLike['callLepusMethod']
) => void;

type SubscribeHostCommit = (
  notify: (method: HostCommitMethod) => void
) => void;

const ELEMENT_TEMPLATE_UPDATE = 'rLynxElementTemplateUpdate';
const ELEMENT_TEMPLATE_COMMIT_ACK = '__LYNX_BENCH_ET_COMMIT_ACK__';

/**
 * NativeApp exposes callLepusMethod as a non-configurable getter without a
 * setter on real Lynx runtimes. Install a stable JS facade at the writable
 * lynx.getNativeApp boundary instead of trying to overwrite that native
 * accessor. Native methods other than callLepusMethod remain bound to the real
 * NativeApp so the facade does not change their receiver.
 */
export function createNativeAppFacadeInstaller(
  nativeLynx: NativeLynxLike
): InstallHostCommitInterceptor {
  const originalGetNativeApp = nativeLynx.getNativeApp.bind(nativeLynx);
  const facades = new WeakMap<NativeAppLike, NativeAppLike>();
  const interceptors = new WeakMap<
    NativeAppLike,
    NativeAppLike['callLepusMethod']
  >();
  let installed = false;

  const facadeFor = (app: NativeAppLike): NativeAppLike => {
    const cached = facades.get(app);
    if (cached) return cached;
    // Do not proxy NativeApp itself: Proxy invariants still forbid reporting a
    // successful write to its non-configurable getter-only property. An empty
    // target lets the facade expose the interceptor as an ordinary JS value.
    const facade = new Proxy({} as NativeAppLike, {
      get(_target, property) {
        if (property === 'callLepusMethod') {
          return interceptors.get(app) ?? app.callLepusMethod.bind(app);
        }
        const value = Reflect.get(app as object, property, app);
        return typeof value === 'function' ? value.bind(app) : value;
      },
      set(_target, property, value) {
        return Reflect.set(app as object, property, value, app);
      },
    });
    facades.set(app, facade);
    return facade;
  };

  return (app, callLepusMethod) => {
    interceptors.set(app, callLepusMethod);
    if (installed) return;
    nativeLynx.getNativeApp = () => {
      const current = originalGetNativeApp();
      return current ? facadeFor(current) : current;
    };
    installed = true;
  };
}

/**
 * Element Template sends commits with a ContextProxy event rather than
 * NativeApp.callLepusMethod. Register this after ReactLynx's main-thread patch
 * listener: ContextProxy listeners run in registration order, so the reply is
 * emitted only after the framework applies the patch and flushes the tree.
 */
export function installElementTemplateCommitAckBridge(
  context?: NativeContextLike
): void {
  const isMainThread =
    typeof __MAIN_THREAD__ !== 'undefined' && __MAIN_THREAD__;
  if (!context && !isMainThread) return;
  const jsContext =
    context ??
    (lynx.getJSContext() as unknown as NativeContextLike);
  jsContext.addEventListener(ELEMENT_TEMPLATE_UPDATE, () => {
    jsContext.dispatchEvent({
      type: ELEMENT_TEMPLATE_COMMIT_ACK,
      data: null,
    });
  });
}

export function createElementTemplateCommitAckSubscriber(
  context: NativeContextLike
): SubscribeHostCommit {
  return (notify) => {
    context.addEventListener(ELEMENT_TEMPLATE_COMMIT_ACK, () => {
      notify(ELEMENT_TEMPLATE_UPDATE);
    });
  };
}

export function createHostCommitTracker(
  getNativeApp: () => NativeAppLike | null | undefined,
  now: () => number,
  installInterceptor?: InstallHostCommitInterceptor,
  subscribeHostCommit?: SubscribeHostCommit
): NativeBenchmarkRuntime['armHostCommit'] {
  const commitMethods = new Set<HostCommitMethod>([
    'rLynxChange',
    'rLynxElementTemplateUpdate',
    'vuePatchUpdate',
    'vueIfrHydrationComplete',
  ]);
  type Waiter = {
    active: boolean;
    bound: boolean;
    methods: ReadonlySet<HostCommitMethod>;
    resolve(value: HostCommitEvidence): void;
    reject(error: unknown): void;
  };
  const waiters: Waiter[] = [];
  const trackedApps = new WeakSet<NativeAppLike>();

  const retire = (waiter: Waiter) => {
    const index = waiters.indexOf(waiter);
    if (index !== -1) waiters.splice(index, 1);
  };
  const resolveWaiter = (waiter: Waiter, method: HostCommitMethod) => {
    waiter.active = false;
    retire(waiter);
    waiter.resolve({
      kind: 'framework-host-commit-callback',
      method,
      acknowledged: true,
      acknowledgedAtMs: now(),
    });
  };
  subscribeHostCommit?.((method) => {
    const waiter = waiters.find(
      (candidate) =>
        candidate.active && !candidate.bound && candidate.methods.has(method)
    );
    if (!waiter) return;
    waiter.bound = true;
    resolveWaiter(waiter, method);
  });

  const rejectedWait = (error: unknown): HostCommitWait => {
    const promise = Promise.reject<HostCommitEvidence>(error);
    // The consumer normally attaches its rejection handler immediately after
    // running the action. Mark it handled now as well, so a user action that
    // throws cannot leave an instrumentation rejection behind.
    void promise.catch(() => {});
    return { promise, cancel() {} };
  };

  return (methods = [...commitMethods]): HostCommitWait => {
    const app = getNativeApp();
    if (!app || typeof app.callLepusMethod !== 'function') {
      return rejectedWait(
        new Error('Native benchmark cannot observe framework host commits')
      );
    }
    if (!trackedApps.has(app)) {
      const originalCallLepusMethod = app.callLepusMethod.bind(app);
      const interceptedCallLepusMethod: NativeAppLike['callLepusMethod'] = (
        method,
        params,
        callback
      ) => {
        const commitMethod = method as HostCommitMethod;
        const waiter = commitMethods.has(commitMethod)
          ? waiters.find(
              (candidate) =>
                candidate.active &&
                !candidate.bound &&
                candidate.methods.has(commitMethod)
            )
          : undefined;
        if (!waiter) {
          originalCallLepusMethod(method, params, callback);
          return;
        }
        waiter.bound = true;
        try {
          originalCallLepusMethod(method, params, (...args) => {
            try {
              callback?.(...args);
            } finally {
              if (waiter.active) {
                resolveWaiter(waiter, commitMethod);
              }
            }
          });
        } catch (error) {
          if (waiter.active) {
            waiter.active = false;
            retire(waiter);
            waiter.reject(error);
          }
          throw error;
        }
      };
      try {
        if (installInterceptor) {
          installInterceptor(app, interceptedCallLepusMethod);
        } else {
          app.callLepusMethod = interceptedCallLepusMethod;
        }
        trackedApps.add(app);
      } catch (error) {
        return rejectedWait(
          new Error(
            `Native benchmark cannot install host-commit observer: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    }

    let resolve!: (value: HostCommitEvidence) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<HostCommitEvidence>((accept, decline) => {
      resolve = accept;
      reject = decline;
    });
    const waiter: Waiter = {
      active: true,
      bound: false,
      methods: new Set(methods),
      resolve,
      reject,
    };
    waiters.push(waiter);
    return {
      promise,
      cancel() {
        waiter.active = false;
        retire(waiter);
      },
    };
  };
}

function defaultRuntime(): NativeBenchmarkRuntime {
  const now = () => Date.now();
  const possibleNative =
    typeof MessageChannel !== 'function' &&
    (typeof __BACKGROUND__ === 'undefined' || __BACKGROUND__);
  const nativeLynx = possibleNative
    ? (lynx as unknown as NativeLynxLike)
    : null;
  const native =
    nativeLynx !== null && typeof nativeLynx.getNativeApp === 'function';
  const armHostCommit = native
    ? (() => {
        return createHostCommitTracker(
          nativeLynx.getNativeApp.bind(nativeLynx),
          now,
          createNativeAppFacadeInstaller(nativeLynx),
          createElementTemplateCommitAckSubscriber(
            lynx.getCoreContext() as unknown as NativeContextLike
          )
        );
      })()
    : createHostCommitTracker(() => undefined, now);
  return {
    // Lynx for Web provides MessageChannel. Native instrumentation belongs on
    // the background VM; ReactLynx also evaluates entry modules on main thread.
    native,
    globalObject: globalThis as BenchmarkGlobal,
    now,
    requestAnimationFrame: (callback) => lynx.requestAnimationFrame(callback),
    setTimeout: (callback) => lynx.setTimeout(callback, 0),
    report: (marker, payload) => console.log(marker, payload),
    armHostCommit,
  };
}

function errorMessage(scope: string, error: unknown): string {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return `${scope}: ${detail}`;
}

function isPromiseLike(value: ActionResult): value is Promise<StormEvidence> {
  return value != null && typeof (value as Promise<void>).then === 'function';
}

export function createNativeBenchmarkProtocol(
  runtime: NativeBenchmarkRuntime = defaultRuntime()
) {
  let snapshotGetter: (() => BenchmarkSnapshot) | null = null;
  let activeOperation: string | null = null;
  const startupCommits = new WeakMap<StartupObservation, HostCommitWait>();

  const reportError = (scope: string, error: unknown) => {
    runtime.report('__NATIVE_BENCH_ERROR__', errorMessage(scope, error));
  };

  const snapshot = (): BenchmarkSnapshot => {
    const getter =
      snapshotGetter ?? runtime.globalObject.__LYNX_BENCH_SNAPSHOT__;
    if (!getter)
      throw new Error('Native benchmark snapshot producer is unavailable');
    return getter();
  };

  const nextFrame = (): Promise<number> =>
    new Promise((resolve) => {
      runtime.requestAnimationFrame(() => resolve(runtime.now()));
    });

  const finishMeasurement = async (
    name: string,
    startMs: number,
    preState: BenchmarkSnapshot,
    stormEvidence: void | StormEvidence,
    transportEvidence?: HostCommitEvidence
  ) => {
    try {
      const observedTransport =
        stormEvidence?.transportEvidence ?? transportEvidence;
      if (!observedTransport) {
        throw new Error(
          'Native benchmark lacks a framework host-commit acknowledgement'
        );
      }
      const firstFrameMs = await nextFrame();
      const endMs = await nextFrame();
      runtime.report(
        '__NATIVE_BENCH_RESULT__',
        JSON.stringify({
          protocol: NATIVE_TABLE_PROTOCOL,
          name,
          source: 'native-tap',
          boundary:
            'native-input-handler-through-host-commit-to-second-native-frame',
          startMs,
          commitAckMs:
            observedTransport.kind === 'framework-host-commit-callback'
              ? observedTransport.acknowledgedAtMs
              : observedTransport.lastAcknowledgedAtMs,
          firstFrameMs,
          endMs,
          latencyMs: endMs - startMs,
          renderEvidence: { kind: 'native-animation-frame', frames: 2 },
          transportEvidence: observedTransport,
          preState,
          postState: snapshot(),
          ...(stormEvidence ? { stormEvidence } : {}),
        })
      );
    } catch (error) {
      reportError(name, error);
    } finally {
      activeOperation = null;
    }
  };

  return {
    isNative: runtime.native,

    installSnapshot(getter: () => BenchmarkSnapshot): () => void {
      if (!runtime.native) return () => {};
      snapshotGetter = getter;
      runtime.globalObject.__LYNX_BENCH_SNAPSHOT__ = getter;
      return () => {
        if (snapshotGetter === getter) snapshotGetter = null;
        if (runtime.globalObject.__LYNX_BENCH_SNAPSHOT__ === getter) {
          delete runtime.globalObject.__LYNX_BENCH_SNAPSHOT__;
        }
      };
    },

    measure(name: string, action: () => ActionResult): void {
      if (!runtime.native) {
        action();
        return;
      }
      if (activeOperation !== null) {
        reportError(
          name,
          new Error(`overlaps active operation ${activeOperation}`)
        );
        // Instrumentation must never suppress the user's real action. The
        // overlapping sample is invalid, but the benchmark UI keeps its
        // ordinary interaction semantics.
        action();
        return;
      }

      let preState: BenchmarkSnapshot;
      try {
        preState = snapshot();
      } catch (error) {
        reportError(name, error);
        action();
        return;
      }

      activeOperation = name;
      // Arm outside the timing interval so the Promise allocation and the
      // one-time callLepusMethod patch cannot make a comparator look slower.
      const commit = runtime.armHostCommit();
      const startMs = runtime.now();
      try {
        const result = action();
        if (isPromiseLike(result)) {
          commit.cancel();
          void result.then(
            (evidence) => finishMeasurement(name, startMs, preState, evidence),
            (error) => {
              reportError(name, error);
              activeOperation = null;
            }
          );
        } else {
          void commit.promise.then(
            (evidence) =>
              finishMeasurement(name, startMs, preState, result, evidence),
            (error) => {
              reportError(name, error);
              activeOperation = null;
            }
          );
        }
      } catch (error) {
        commit.cancel();
        reportError(name, error);
        activeOperation = null;
        throw error;
      }
    },

    async runStorm(
      ticks: number,
      step: (tick: number) => void
    ): Promise<StormEvidence> {
      let completedTicks = 0;
      let renderBarriers = 0;
      let hostCommitBarriers = 0;
      let lastAcknowledgedAtMs = 0;
      const methods = new Set<HostCommitMethod>();
      for (let tick = 1; tick <= ticks; tick++) {
        await new Promise<void>((resolve) => runtime.setTimeout(resolve));
        const commit = runtime.armHostCommit();
        try {
          step(tick);
          const evidence = await commit.promise;
          hostCommitBarriers++;
          lastAcknowledgedAtMs = evidence.acknowledgedAtMs;
          methods.add(evidence.method);
        } catch (error) {
          commit.cancel();
          throw error;
        }
        completedTicks = tick;
        await nextFrame();
        renderBarriers++;
      }
      return {
        expectedTicks: ticks,
        completedTicks,
        renderBarriers,
        hostCommitBarriers,
        transportEvidence: {
          kind: 'per-tick-framework-host-commit-callbacks',
          methods: [...methods],
          acknowledged: true,
          count: hostCommitBarriers,
          lastAcknowledgedAtMs,
        },
      };
    },

    beginStartup(): StartupObservation | null {
      if (!runtime.native) return null;
      const observation: StartupObservation = {
        protocol: NATIVE_STARTUP_PROTOCOL,
        moduleStartMs: runtime.now(),
        renderEvidence: { kind: 'native-animation-frame', frames: 2 },
      };
      const commit = runtime.armHostCommit(
        runtime.globalObject.__VUE_LYNX_IFR_ENABLED__
          ? ['vueIfrHydrationComplete']
          : [
              'rLynxChange',
              'rLynxElementTemplateUpdate',
              'vuePatchUpdate',
            ]
      );
      startupCommits.set(observation, commit);
      runtime.globalObject.__LYNX_BENCH_STARTUP__ = observation;
      return observation;
    },

    finishStartup(observation: StartupObservation | null): void {
      if (!observation) return;
      void (async () => {
        try {
          const commit = startupCommits.get(observation);
          if (!commit) {
            throw new Error(
              'Native startup host-commit waiter is unavailable'
            );
          }
          const evidence = await commit.promise;
          observation.commitAckMs = evidence.acknowledgedAtMs;
          observation.transportEvidence = evidence;
          observation.firstFrameMs = await nextFrame();
          observation.secondFrameMs = await nextFrame();
          observation.postState = snapshot();
          runtime.report(
            '__NATIVE_BENCH_STARTUP__',
            JSON.stringify(observation)
          );
        } catch (error) {
          reportError('startup', error);
        }
      })();
    },
  };
}

export const nativeBenchmark = createNativeBenchmarkProtocol();
