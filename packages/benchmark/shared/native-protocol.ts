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

export function createHostCommitTracker(
  getNativeApp: () => NativeAppLike | null | undefined,
  now: () => number
): NativeBenchmarkRuntime['armHostCommit'] {
  const commitMethods = new Set<HostCommitMethod>([
    'rLynxChange',
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
  let trackedApp: NativeAppLike | null | undefined;

  return (methods = [...commitMethods]): HostCommitWait => {
    const app = getNativeApp();
    if (!app || typeof app.callLepusMethod !== 'function') {
      const promise = Promise.reject<HostCommitEvidence>(
        new Error('Native benchmark cannot observe framework host commits')
      );
      // The consumer normally attaches its rejection handler immediately
      // after running the action. Mark it handled now as well, so a user
      // action that throws cannot leave an instrumentation rejection behind.
      void promise.catch(() => {});
      return {
        promise,
        cancel() {},
      };
    }
    if (trackedApp !== app) {
      trackedApp = app;
      const originalCallLepusMethod = app.callLepusMethod.bind(app);
      app.callLepusMethod = (method, params, callback) => {
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
        const retire = () => {
          const index = waiters.indexOf(waiter);
          if (index !== -1) waiters.splice(index, 1);
        };
        try {
          originalCallLepusMethod(method, params, (...args) => {
            try {
              callback?.(...args);
            } finally {
              if (waiter.active) {
                waiter.active = false;
                retire();
                waiter.resolve({
                  kind: 'framework-host-commit-callback',
                  method: commitMethod,
                  acknowledged: true,
                  acknowledgedAtMs: now(),
                });
              }
            }
          });
        } catch (error) {
          if (waiter.active) {
            waiter.active = false;
            retire();
            waiter.reject(error);
          }
          throw error;
        }
      };
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
        const index = waiters.indexOf(waiter);
        if (index !== -1) waiters.splice(index, 1);
      },
    };
  };
}

function defaultRuntime(): NativeBenchmarkRuntime {
  const now = () => Date.now();
  const armHostCommit = createHostCommitTracker(
    () => lynx.getNativeApp() as NativeAppLike | null | undefined,
    now
  );
  return {
    // Lynx for Web provides MessageChannel. The Native background VM does not.
    native: typeof MessageChannel !== 'function',
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
          : ['rLynxChange', 'vuePatchUpdate']
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
