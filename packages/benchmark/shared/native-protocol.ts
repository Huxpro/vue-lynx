export const NATIVE_TABLE_PROTOCOL = 'lynx-native-bench-v2' as const;
export const NATIVE_STARTUP_PROTOCOL = 'lynx-native-startup-v1' as const;
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
}

export interface StartupObservation {
  protocol: typeof NATIVE_STARTUP_PROTOCOL;
  moduleStartMs: number;
  firstFrameMs?: number;
  secondFrameMs?: number;
  renderEvidence: {
    kind: 'native-animation-frame';
    frames: 2;
  };
  postState?: BenchmarkSnapshot;
}

interface BenchmarkGlobal {
  __LYNX_BENCH_SNAPSHOT__?: () => BenchmarkSnapshot;
  __LYNX_BENCH_STARTUP__?: StartupObservation;
}

export interface NativeBenchmarkRuntime {
  native: boolean;
  globalObject: BenchmarkGlobal;
  now(): number;
  requestAnimationFrame(callback: () => void): void;
  setTimeout(callback: () => void): void;
  report(marker: string, payload: string): void;
}

type ActionResult = void | StormEvidence | Promise<void | StormEvidence>;

function defaultRuntime(): NativeBenchmarkRuntime {
  return {
    // Lynx for Web provides MessageChannel. The Native background VM does not.
    native: typeof MessageChannel !== 'function',
    globalObject: globalThis as BenchmarkGlobal,
    now: () => Date.now(),
    requestAnimationFrame: (callback) => lynx.requestAnimationFrame(callback),
    setTimeout: (callback) => lynx.setTimeout(callback, 0),
    report: (marker, payload) => console.log(marker, payload),
  };
}

function errorMessage(scope: string, error: unknown): string {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return `${scope}: ${detail}`;
}

function isPromiseLike(
  value: void | StormEvidence | Promise<void | StormEvidence>
): value is Promise<void | StormEvidence> {
  return value != null && typeof (value as Promise<void>).then === 'function';
}

export function createNativeBenchmarkProtocol(
  runtime: NativeBenchmarkRuntime = defaultRuntime()
) {
  let snapshotGetter: (() => BenchmarkSnapshot) | null = null;
  let activeOperation: string | null = null;

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
    stormEvidence: void | StormEvidence
  ) => {
    try {
      const firstFrameMs = await nextFrame();
      const endMs = await nextFrame();
      runtime.report(
        '__NATIVE_BENCH_RESULT__',
        JSON.stringify({
          protocol: NATIVE_TABLE_PROTOCOL,
          name,
          source: 'native-tap',
          boundary: 'native-input-handler-to-second-native-frame',
          startMs,
          firstFrameMs,
          endMs,
          latencyMs: endMs - startMs,
          renderEvidence: { kind: 'native-animation-frame', frames: 2 },
          transportEvidence: { kind: 'not-exposed', acknowledged: false },
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
      const startMs = runtime.now();
      try {
        const result = action();
        if (isPromiseLike(result)) {
          void result.then(
            (evidence) => finishMeasurement(name, startMs, preState, evidence),
            (error) => {
              reportError(name, error);
              activeOperation = null;
            }
          );
        } else {
          void finishMeasurement(name, startMs, preState, result);
        }
      } catch (error) {
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
      for (let tick = 1; tick <= ticks; tick++) {
        await new Promise<void>((resolve) => runtime.setTimeout(resolve));
        step(tick);
        completedTicks = tick;
        await nextFrame();
        renderBarriers++;
      }
      return { expectedTicks: ticks, completedTicks, renderBarriers };
    },

    beginStartup(): StartupObservation | null {
      if (!runtime.native) return null;
      const observation: StartupObservation = {
        protocol: NATIVE_STARTUP_PROTOCOL,
        moduleStartMs: runtime.now(),
        renderEvidence: { kind: 'native-animation-frame', frames: 2 },
      };
      runtime.globalObject.__LYNX_BENCH_STARTUP__ = observation;
      return observation;
    },

    finishStartup(observation: StartupObservation | null): void {
      if (!observation) return;
      void (async () => {
        try {
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
