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

function createRuntime({ native = true } = {}) {
  let time = 100;
  const reports = [];
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
  return { runtime, reports };
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
  assert.equal(payload.protocol, 'lynx-native-bench-v2');
  assert.equal(payload.boundary, 'native-input-handler-to-second-native-frame');
  assert.equal(payload.preState.rowCount, 0);
  assert.equal(payload.postState.rowCount, 1000);
  assert.equal(payload.renderEvidence.frames, 2);
  assert.equal(payload.latencyMs, 32);
  removeSnapshot();
  assert.equal(runtime.globalObject.__LYNX_BENCH_SNAPSHOT__, undefined);
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
  });
  assert.equal(payload.latencyMs, 83);
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
  assert.equal(payload.protocol, 'lynx-native-startup-v1');
  assert.equal(payload.postState.rowCount, 1000);
  assert.equal(payload.firstFrameMs, 116);
  assert.equal(payload.secondFrameMs, 132);
  assert.deepEqual(runtime.globalObject.__LYNX_BENCH_STARTUP__, payload);
  assert.equal(NATIVE_STARTUP_TIMING_FLAG, 'lynx-native-bench-startup');
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
