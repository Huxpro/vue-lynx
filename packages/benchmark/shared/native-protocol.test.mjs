import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = fs.readFileSync(
  new URL('./native-protocol.ts', import.meta.url),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

async function loadProtocol() {
  const encoded = Buffer.from(compiled).toString('base64');
  return import(`data:text/javascript;base64,${encoded}#${Math.random()}`);
}

function createRuntime({ native = true, hostCommits = 'auto' } = {}) {
  let time = 100;
  const reports = [];
  const commitWaiters = [];
  const runtime = {
    native,
    globalObject: {},
    now: () => time,
    requestAnimationFrame(callback) {
      time += 16;
      queueMicrotask(callback);
    },
    setTimeout(callback) {
      time += 1;
      queueMicrotask(callback);
    },
    report(marker, payload) {
      reports.push({ marker, payload });
    },
  };
  runtime.armHostCommit = (methods = [
    'rLynxChange',
    'vuePatchUpdate',
    'vueIfrHydrationComplete',
  ]) => {
    let active = true;
    let resolve;
    const promise = new Promise((accept) => {
      resolve = accept;
    });
    const waiter = {
      resolve(method) {
        if (!active || !methods.includes(method)) return false;
        active = false;
        time += 7;
        resolve({
          kind: 'framework-host-commit-callback',
          method,
          acknowledged: true,
          acknowledgedAtMs: time,
        });
        return true;
      },
    };
    commitWaiters.push(waiter);
    if (hostCommits === 'auto') {
      const method = methods.includes('vuePatchUpdate')
        ? 'vuePatchUpdate'
        : methods[0];
      queueMicrotask(() => waiter.resolve(method));
    }
    return {
      promise,
      cancel() {
        active = false;
      },
    };
  };
  const acknowledgeHostCommit = (method = 'vuePatchUpdate') => {
    const waiter = commitWaiters.find((candidate) => candidate.resolve(method));
    assert.ok(waiter, 'no armed host-commit waiter');
  };
  return { runtime, reports, acknowledgeHostCommit };
}

async function flushTasks(count = 20) {
  for (let i = 0; i < count; i++) await Promise.resolve();
}

const state = (rowCount) => ({
  rowCount,
  firstId: rowCount > 0 ? 1 : null,
  secondId: rowCount > 1 ? 2 : null,
  thirdId: rowCount > 2 ? 3 : null,
  row998Id: rowCount > 998 ? 999 : null,
  firstLabel: rowCount > 0 ? 'pretty red table' : null,
  selectedId: null,
});

test('host-commit tracker preserves callbacks and respects the armed method', async () => {
  const { createHostCommitTracker } = await loadProtocol();
  const calls = [];
  const events = [];
  const app = {
    callLepusMethod(method, params, callback) {
      calls.push({ method, params, callback });
    },
  };
  const arm = createHostCommitTracker(() => app, () => 123);
  const wait = arm(['vueIfrHydrationComplete']);
  let resolved = false;
  void wait.promise.then(() => {
    resolved = true;
    events.push('resolved');
  });

  const ordinaryCallback = () => events.push('ordinary');
  app.callLepusMethod('vuePatchUpdate', {}, ordinaryCallback);
  assert.equal(calls[0].callback, ordinaryCallback);
  calls[0].callback();
  await flushTasks();
  assert.equal(resolved, false);

  app.callLepusMethod('vueIfrHydrationComplete', {}, (...args) => {
    events.push(`framework:${args.join(',')}`);
  });
  assert.notEqual(calls[1].callback, undefined);
  calls[1].callback('ack', 7);
  const evidence = await wait.promise;

  assert.deepEqual(events, ['ordinary', 'framework:ack,7', 'resolved']);
  assert.deepEqual(evidence, {
    kind: 'framework-host-commit-callback',
    method: 'vueIfrHydrationComplete',
    acknowledged: true,
    acknowledgedAtMs: 123,
  });
});

test('host-commit tracker keeps each native app bound to its own transport', async () => {
  const { createHostCommitTracker } = await loadProtocol();
  const firstCalls = [];
  const secondCalls = [];
  const firstApp = {
    callLepusMethod(method) {
      firstCalls.push(method);
    },
  };
  const secondApp = {
    callLepusMethod(method) {
      secondCalls.push(method);
    },
  };
  let currentApp = firstApp;
  const arm = createHostCommitTracker(() => currentApp, () => 0);
  arm().cancel();
  currentApp = secondApp;
  arm().cancel();

  firstApp.callLepusMethod('ordinaryFirstAppCall');
  secondApp.callLepusMethod('ordinarySecondAppCall');

  assert.deepEqual(firstCalls, ['ordinaryFirstAppCall']);
  assert.deepEqual(secondCalls, ['ordinarySecondAppCall']);
});

test('host-commit tracker observes real Lynx getter-only NativeApp through a facade', async () => {
  const { createHostCommitTracker, createNativeAppFacadeInstaller } =
    await loadProtocol();
  const calls = [];
  const originalCallLepusMethod = function (method, params, callback) {
    calls.push({ receiver: this, method, params, callback });
  };
  const app = {};
  Object.defineProperty(app, 'callLepusMethod', {
    configurable: false,
    enumerable: false,
    get: () => originalCallLepusMethod,
  });
  Object.defineProperty(app, 'receiverCheck', {
    configurable: false,
    get: () => function () {
      return this;
    },
  });
  const nativeLynx = {
    getNativeApp() {
      return app;
    },
  };
  const originalGetNativeApp = nativeLynx.getNativeApp.bind(nativeLynx);
  const arm = createHostCommitTracker(
    originalGetNativeApp,
    () => 456,
    createNativeAppFacadeInstaller(nativeLynx)
  );

  const wait = arm(['rLynxChange']);
  const facade = nativeLynx.getNativeApp();
  assert.notEqual(facade, app);
  assert.equal(nativeLynx.getNativeApp(), facade);
  assert.equal(facade.receiverCheck(), app);
  facade.callLepusMethod('rLynxChange', { rows: 1000 }, () => {});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].receiver, app);
  calls[0].callback();

  assert.deepEqual(await wait.promise, {
    kind: 'framework-host-commit-callback',
    method: 'rLynxChange',
    acknowledged: true,
    acknowledgedAtMs: 456,
  });
  assert.equal(app.callLepusMethod, originalCallLepusMethod);
});

test('getter-only NativeApp observer failure rejects without breaking the app', async () => {
  const { createHostCommitTracker } = await loadProtocol();
  const app = {};
  Object.defineProperty(app, 'callLepusMethod', {
    configurable: false,
    get: () => () => {},
  });
  const arm = createHostCommitTracker(() => app, () => 0);

  let wait;
  assert.doesNotThrow(() => {
    wait = arm();
  });
  await assert.rejects(
    wait.promise,
    /cannot install host-commit observer:.*(?:setter|getter|read only)/i
  );
});

test('native operation reports the versioned two-frame payload', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports } = createRuntime();
  const protocol = createNativeBenchmarkProtocol(runtime);
  let rows = 0;
  const removeSnapshot = protocol.installSnapshot(() => state(rows));
  assert.equal(typeof runtime.globalObject.__LYNX_BENCH_SNAPSHOT__, 'function');

  protocol.measure('create', () => {
    rows = 1000;
  });
  await flushTasks();

  assert.equal(reports.length, 1);
  assert.equal(reports[0].marker, '__NATIVE_BENCH_RESULT__');
  const payload = JSON.parse(reports[0].payload);
  assert.equal(payload.protocol, 'lynx-native-bench-v3');
  assert.equal(
    payload.boundary,
    'native-input-handler-through-host-commit-to-second-native-frame'
  );
  assert.equal(payload.preState.rowCount, 0);
  assert.equal(payload.postState.rowCount, 1000);
  assert.equal(payload.renderEvidence.frames, 2);
  assert.equal(payload.commitAckMs, 107);
  assert.equal(payload.latencyMs, 39);
  removeSnapshot();
  assert.equal(runtime.globalObject.__LYNX_BENCH_SNAPSHOT__, undefined);
});

test('native operation waits for the real framework host-commit callback', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports, acknowledgeHostCommit } = createRuntime({
    hostCommits: 'manual',
  });
  const protocol = createNativeBenchmarkProtocol(runtime);
  let rows = 0;
  protocol.installSnapshot(() => state(rows));

  protocol.measure('create', () => {
    rows = 1000;
  });
  await flushTasks();
  assert.equal(reports.length, 0);

  acknowledgeHostCommit();
  await flushTasks();
  const payload = JSON.parse(reports[0].payload);
  assert.equal(
    payload.boundary,
    'native-input-handler-through-host-commit-to-second-native-frame'
  );
  assert.deepEqual(payload.transportEvidence, {
    kind: 'framework-host-commit-callback',
    method: 'vuePatchUpdate',
    acknowledged: true,
    acknowledgedAtMs: 107,
  });
  assert.equal(payload.latencyMs, 39);
});

test('native storm proves one render barrier per completed tick', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports } = createRuntime();
  const protocol = createNativeBenchmarkProtocol(runtime);
  let rows = 1000;
  let completed = 0;
  protocol.installSnapshot(() => state(rows));

  protocol.measure('updateStorm', () =>
    protocol.runStorm(3, (tick) => {
      completed = tick;
      rows = 1000;
    })
  );
  await flushTasks(40);

  assert.equal(completed, 3);
  const payload = JSON.parse(reports[0].payload);
  assert.deepEqual(payload.stormEvidence, {
    expectedTicks: 3,
    completedTicks: 3,
    renderBarriers: 3,
    hostCommitBarriers: 3,
    transportEvidence: {
      kind: 'per-tick-framework-host-commit-callbacks',
      methods: ['vuePatchUpdate'],
      acknowledged: true,
      count: 3,
      lastAcknowledgedAtMs: 156,
    },
  });
  assert.deepEqual(
    payload.transportEvidence,
    payload.stormEvidence.transportEvidence
  );
  assert.equal(payload.commitAckMs, 156);
  assert.equal(payload.latencyMs, 104);
});

test('native storm waits for every host-commit callback', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports, acknowledgeHostCommit } = createRuntime({
    hostCommits: 'manual',
  });
  const protocol = createNativeBenchmarkProtocol(runtime);
  let completed = 0;
  protocol.installSnapshot(() => state(1000));

  protocol.measure('selectStorm', () =>
    protocol.runStorm(2, (tick) => {
      completed = tick;
    })
  );
  await flushTasks();
  assert.equal(completed, 1);
  assert.equal(reports.length, 0);

  acknowledgeHostCommit('rLynxChange');
  await flushTasks();
  assert.equal(completed, 2);
  assert.equal(reports.length, 0);

  acknowledgeHostCommit('rLynxChange');
  await flushTasks();
  const payload = JSON.parse(reports[0].payload);
  assert.equal(payload.stormEvidence.hostCommitBarriers, 2);
  assert.deepEqual(payload.transportEvidence.methods, ['rLynxChange']);
  assert.equal(payload.transportEvidence.count, 2);
});

test('startup receipt is published only after mount and two frames', async () => {
  const { createNativeBenchmarkProtocol, NATIVE_STARTUP_TIMING_FLAG } =
    await loadProtocol();
  const { runtime, reports } = createRuntime();
  const protocol = createNativeBenchmarkProtocol(runtime);
  const startup = protocol.beginStartup();
  protocol.installSnapshot(() => state(1000));
  protocol.finishStartup(startup);
  await flushTasks();

  assert.equal(reports[0].marker, '__NATIVE_BENCH_STARTUP__');
  const payload = JSON.parse(reports[0].payload);
  assert.equal(payload.protocol, 'lynx-native-startup-v2');
  assert.equal(payload.postState.rowCount, 1000);
  assert.equal(payload.commitAckMs, 107);
  assert.equal(payload.firstFrameMs, 123);
  assert.equal(payload.secondFrameMs, 139);
  assert.deepEqual(runtime.globalObject.__LYNX_BENCH_STARTUP__, payload);
  assert.equal(NATIVE_STARTUP_TIMING_FLAG, 'lynx-native-bench-startup');
});

test('startup waits for the real framework host-commit callback', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports, acknowledgeHostCommit } = createRuntime({
    hostCommits: 'manual',
  });
  const protocol = createNativeBenchmarkProtocol(runtime);
  const startup = protocol.beginStartup();
  protocol.installSnapshot(() => state(1000));
  protocol.finishStartup(startup);
  await flushTasks();
  assert.equal(reports.length, 0);

  acknowledgeHostCommit('rLynxChange');
  await flushTasks();
  const payload = JSON.parse(reports[0].payload);
  assert.equal(payload.commitAckMs, 107);
  assert.deepEqual(payload.transportEvidence, {
    kind: 'framework-host-commit-callback',
    method: 'rLynxChange',
    acknowledged: true,
    acknowledgedAtMs: 107,
  });
  assert.equal(payload.firstFrameMs, 123);
  assert.equal(payload.secondFrameMs, 139);
});

test('producer failures emit an explicit runtime marker', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports } = createRuntime();
  const protocol = createNativeBenchmarkProtocol(runtime);
  protocol.installSnapshot(() => state(0));

  assert.throws(
    () =>
      protocol.measure('create', () => {
        throw new Error('render failed');
      }),
    /render failed/
  );
  await flushTasks();

  assert.deepEqual(reports, [
    {
      marker: '__NATIVE_BENCH_ERROR__',
      payload: 'create: Error: render failed',
    },
  ]);
});

test('an invalid overlapping sample never suppresses the real action', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports } = createRuntime();
  const protocol = createNativeBenchmarkProtocol(runtime);
  let actions = 0;
  protocol.installSnapshot(() => state(actions));

  protocol.measure('create', () => {
    actions++;
  });
  protocol.measure('create', () => {
    actions++;
  });
  await flushTasks();

  assert.equal(actions, 2);
  assert.equal(reports[0].marker, '__NATIVE_BENCH_ERROR__');
  assert.match(reports[0].payload, /overlaps active operation/);
  assert.equal(reports[1].marker, '__NATIVE_BENCH_RESULT__');
});

test('web keeps actions synchronous and emits no native receipts', async () => {
  const { createNativeBenchmarkProtocol } = await loadProtocol();
  const { runtime, reports } = createRuntime({ native: false });
  const protocol = createNativeBenchmarkProtocol(runtime);
  let ran = false;
  protocol.measure('create', () => {
    ran = true;
  });

  assert.equal(ran, true);
  assert.deepEqual(reports, []);
  assert.equal(protocol.beginStartup(), null);
});
