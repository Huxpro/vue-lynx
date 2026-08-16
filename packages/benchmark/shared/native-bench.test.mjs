import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const benchmarkRoot = new URL('../', import.meta.url);
const helperUrl = new URL('shared/native-bench.ts', benchmarkRoot);
const sharedDataUrl = new URL('shared/data.ts', benchmarkRoot);
const vdomAppUrl = new URL('apps/ui-vdom/src/App.vue', benchmarkRoot);
const vaporAppUrl = new URL('apps/ui-vapor/src/App.vue', benchmarkRoot);
const reactAppUrl = new URL('apps/ui-react/src/App.tsx', benchmarkRoot);
const reactDataUrl = new URL('apps/ui-react/src/data.ts', benchmarkRoot);

const expectedProtocol = 'vue-lynx-native-bench-v1';
const expectedWorkloads = [
  'create',
  'append1k',
  'update10th',
  'select',
  'swap',
  'remove',
  'clear',
  'updateStorm',
  'selectStorm',
];

function compileTsModule(moduleUrl) {
  const source = fs.readFileSync(moduleUrl, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: moduleUrl.pathname,
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(errors, []);
  return result.outputText;
}

function loadTsModule(moduleUrl, imports = {}) {
  const module = { exports: {} };
  const context = vm.createContext({
    exports: module.exports,
    module,
    require(specifier) {
      if (Object.hasOwn(imports, specifier)) return imports[specifier];
      throw new Error(`Unexpected ${path.basename(moduleUrl.pathname)} import: ${specifier}`);
    },
  });
  new vm.Script(compileTsModule(moduleUrl), {
    filename: moduleUrl.pathname,
  }).runInContext(context);
  return module.exports;
}

const {
  NATIVE_BENCH_PROTOCOL,
  NATIVE_BENCH_WORKLOADS,
  createNativeBench,
} = loadTsModule(helperUrl);

function createWebGlobals() {
  let dateNowCalls = 0;
  const channelTasks = [];
  const frameTasks = [];
  const timerTasks = [];
  const logs = [];

  class FakeMessageChannel {
    port1 = {
      onmessage: null,
      postMessage: () => {},
    };

    port2 = {
      onmessage: null,
      postMessage: () => {
        channelTasks.push(() => this.port1.onmessage?.());
      },
    };
  }

  return {
    channelTasks,
    dateNowCalls: () => dateNowCalls,
    frameScheduler: {
      requestAnimationFrame: task => frameTasks.push(task),
      setTimeout: (task, delay) => {
        timerTasks.push(task);
        return delay;
      },
    },
    frameTasks,
    globals: {
      MessageChannel: FakeMessageChannel,
      Date: {
        now: () => {
          dateNowCalls++;
          return 0;
        },
      },
      console: { log: (...args) => logs.push(args) },
    },
    logs,
    timerTasks,
  };
}

function createNativeGlobals() {
  let now = 100;
  let dateNowCalls = 0;
  const frameTasks = [];
  const timerTasks = [];
  const timerDelays = [];
  const logs = [];

  return {
    dateNowCalls: () => dateNowCalls,
    frameScheduler: {
      requestAnimationFrame: task => frameTasks.push(task),
      setTimeout: (task, delay) => {
        timerTasks.push(task);
        timerDelays.push(delay);
        return timerTasks.length;
      },
    },
    frameTasks,
    globals: {
      Date: {
        now: () => {
          dateNowCalls++;
          return now;
        },
      },
      console: { log: (...args) => logs.push(args) },
    },
    logs,
    setNow(value) {
      now = value;
    },
    timerDelays,
    timerTasks,
  };
}

function expectedPayload(name, startMs, endMs) {
  return {
    protocol: expectedProtocol,
    name,
    startMs,
    endMs,
    latencyMs: endMs - startMs,
  };
}

test('exports the exact Native protocol and workload labels', () => {
  assert.equal(NATIVE_BENCH_PROTOCOL, expectedProtocol);
  assert.deepEqual(Array.from(NATIVE_BENCH_WORKLOADS), expectedWorkloads);
});

test('Web actions and storms use MessageChannel with zero timing side effects', () => {
  const web = createWebGlobals();
  const bench = createNativeBench(web.frameScheduler, web.globals);

  for (const workload of expectedWorkloads) {
    const finish = bench.startMeasure(workload);
    finish();
    finish();
  }

  let actionCalls = 0;
  const finish = bench.startMeasure('create');
  actionCalls++;
  finish();

  const ticks = [];
  bench.runStorm('updateStorm', 3, tick => ticks.push(tick));
  assert.equal(web.channelTasks.length, 1);
  while (web.channelTasks.length > 0) web.channelTasks.shift()?.();

  assert.equal(actionCalls, 1);
  assert.deepEqual(ticks, [1, 2, 3]);
  assert.equal(web.dateNowCalls(), 0);
  assert.equal(web.timerTasks.length, 0);
  assert.equal(web.frameTasks.length, 0);
  assert.deepEqual(web.logs, []);
});

test('Native actions report the exact protocol payload once after two frames', () => {
  const native = createNativeGlobals();
  const bench = createNativeBench(native.frameScheduler, native.globals);
  const finish = bench.startMeasure('append1k');

  native.setNow(110);
  finish();
  finish();

  assert.equal(native.frameTasks.length, 1);
  assert.deepEqual(native.logs, []);
  native.frameTasks.shift()?.();
  assert.equal(native.frameTasks.length, 1);
  assert.deepEqual(native.logs, []);

  native.setNow(145);
  native.frameTasks.shift()?.();
  assert.deepEqual(native.logs, [[
    '__NATIVE_BENCH_RESULT__',
    JSON.stringify(expectedPayload('append1k', 100, 145)),
  ]]);
  assert.equal(native.dateNowCalls(), 2);

  finish();
  assert.equal(native.frameTasks.length, 0);
  assert.equal(native.logs.length, 1);
});

test('Native emits the exact payload shape for every workload', () => {
  const observed = [];

  for (const workload of expectedWorkloads) {
    const native = createNativeGlobals();
    const bench = createNativeBench(native.frameScheduler, native.globals);
    const finish = bench.startMeasure(workload);
    finish();
    native.frameTasks.shift()?.();
    native.setNow(125);
    native.frameTasks.shift()?.();

    assert.equal(native.logs.length, 1);
    assert.equal(native.logs[0][0], '__NATIVE_BENCH_RESULT__');
    const payload = JSON.parse(native.logs[0][1]);
    assert.deepEqual(Object.keys(payload), [
      'protocol',
      'name',
      'startMs',
      'endMs',
      'latencyMs',
    ]);
    assert.deepEqual(payload, expectedPayload(workload, 100, 125));
    observed.push(payload.name);
  }

  assert.deepEqual(observed, expectedWorkloads);
});

test('Native storms use timer tasks and finish after the final tick', () => {
  const native = createNativeGlobals();
  const bench = createNativeBench(native.frameScheduler, native.globals);
  const ticks = [];

  bench.runStorm('selectStorm', 3, tick => ticks.push(tick));
  assert.deepEqual(native.timerDelays, [0]);
  assert.equal(native.frameTasks.length, 0);

  native.timerTasks.shift()?.();
  assert.deepEqual(ticks, [1]);
  assert.deepEqual(native.timerDelays, [0, 0]);
  assert.equal(native.frameTasks.length, 0);

  native.timerTasks.shift()?.();
  assert.deepEqual(ticks, [1, 2]);
  assert.deepEqual(native.timerDelays, [0, 0, 0]);
  assert.equal(native.frameTasks.length, 0);

  native.timerTasks.shift()?.();
  assert.deepEqual(ticks, [1, 2, 3]);
  assert.equal(native.timerTasks.length, 0);
  assert.equal(native.frameTasks.length, 1);

  native.frameTasks.shift()?.();
  native.setNow(180);
  native.frameTasks.shift()?.();
  assert.deepEqual(native.logs, [[
    '__NATIVE_BENCH_RESULT__',
    JSON.stringify(expectedPayload('selectStorm', 100, 180)),
  ]]);
});

test('a thrown Native action cannot emit a success marker', () => {
  const native = createNativeGlobals();
  const bench = createNativeBench(native.frameScheduler, native.globals);
  const finish = bench.startMeasure('create');
  const action = () => {
    throw new Error('action failed');
  };

  assert.throws(() => {
    action();
    finish();
  }, /action failed/);
  assert.equal(native.frameTasks.length, 0);
  assert.deepEqual(native.logs, []);
});

test('a thrown Native storm tick cannot emit a success marker', () => {
  const native = createNativeGlobals();
  const bench = createNativeBench(native.frameScheduler, native.globals);
  const ticks = [];

  bench.runStorm('updateStorm', 3, tick => {
    ticks.push(tick);
    if (tick === 2) throw new Error('storm failed');
  });
  native.timerTasks.shift()?.();
  assert.throws(() => native.timerTasks.shift()?.(), /storm failed/);

  assert.deepEqual(ticks, [1, 2]);
  assert.equal(native.timerTasks.length, 0);
  assert.equal(native.frameTasks.length, 0);
  assert.deepEqual(native.logs, []);
});

function assertAutoRowsContract(source, framework) {
  const seededLiteral =
    /\bbuildDataSeeded\(\s*__BENCH_AUTOROWS__\s*,\s*42\s*\)/.test(source);
  const seededConstant =
    /const INITIAL_ROWS_SEED\s*=\s*42/.test(source)
    && /\bbuildDataSeeded\(\s*__BENCH_AUTOROWS__\s*,\s*INITIAL_ROWS_SEED\s*\)/.test(source);
  assert.ok(
    seededLiteral || seededConstant,
    `${framework} BENCH_AUTOROWS initialization changed unexpectedly`,
  );
}

test('Vue and React generate identical deterministic startup rows', () => {
  const vueData = loadTsModule(sharedDataUrl, {
    vue: { shallowRef: value => ({ value }) },
  });
  const reactData = loadTsModule(reactDataUrl);

  const vueRows = Array.from(
    vueData.buildDataSeeded(32, 42),
    row => ({ id: row.id, label: row.label.value }),
  );
  const reactRows = Array.from(
    reactData.buildDataSeeded(32, 42),
    row => ({ id: row.id, label: row.label }),
  );

  assert.deepEqual(vueRows, reactRows);
});

test('Vue and React retain workload, handler, storm, and autoRows contracts', () => {
  const vue = fs.readFileSync(vdomAppUrl, 'utf8');
  const react = fs.readFileSync(reactAppUrl, 'utf8');

  for (const workload of expectedWorkloads) {
    assert.ok(vue.includes(`'${workload}'`), `Vue is missing ${workload}`);
    assert.ok(react.includes(`'${workload}'`), `React is missing ${workload}`);
  }
  assertAutoRowsContract(vue, 'Vue');
  assertAutoRowsContract(react, 'React');

  for (const scale of ['1,000', '3,000', '5,000', '10,000', '20,000', '30,000']) {
    assert.ok(vue.includes(`Create ${scale} rows`), `Vue is missing ${scale}`);
    assert.ok(react.includes(`Create ${scale} rows`), `React is missing ${scale}`);
  }
  assert.equal(
    vue.match(/startNativeMeasure\('create'\)/g)?.length,
    6,
    'Vue must measure every create scale',
  );
  assert.equal(
    react.match(/startNativeMeasure\('create'\)/g)?.length,
    6,
    'React must measure every create scale',
  );

  for (const [framework, source] of [['Vue', vue], ['React', react]]) {
    assert.ok(
      source.includes('const STORM_UPDATE_TICKS = 50'),
      `${framework} update storm tick count changed`,
    );
    assert.ok(
      source.includes('const STORM_SELECT_TICKS = 30'),
      `${framework} select storm tick count changed`,
    );
  }
  assert.ok(
    vue.includes("_rows[i].label.value = 'bench ' + t"),
    'Vue update storm predicate changed',
  );
  assert.ok(
    vue.includes(': _rows[0].id'),
    'Vue select storm completion changed',
  );
  assert.ok(
    react.includes("i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r"),
    'React update storm predicate changed',
  );
  assert.ok(
    react.includes(': ids[0]'),
    'React select storm completion changed',
  );

  for (const binding of [
    '@tap="run()"',
    '@tap="run3k()"',
    '@tap="run5k()"',
    '@tap="runLots()"',
    '@tap="run20k()"',
    '@tap="run30k()"',
    '@tap="select(row.id)"',
    '@tap="remove(row.id)"',
  ]) {
    assert.ok(vue.includes(binding), `Vue binding changed: ${binding}`);
  }
  for (const binding of [
    'bindtap={run}',
    'bindtap={run3k}',
    'bindtap={run5k}',
    'bindtap={runLots}',
    'bindtap={run20k}',
    'bindtap={run30k}',
    'onSelect={select}',
    'onRemove={remove}',
  ]) {
    assert.ok(react.includes(binding), `React binding changed: ${binding}`);
  }
});

test('ui-vapor is exactly generated from ui-vdom by the marker contract', () => {
  const marker = '<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">';
  const vue = fs.readFileSync(vdomAppUrl, 'utf8');
  const vapor = fs.readFileSync(vaporAppUrl, 'utf8');

  assert.ok(vue.startsWith(marker));
  assert.equal(
    vapor,
    `<!-- GENERATED from apps/ui-vdom/src/App.vue — do not edit -->\n${
      vue.replace(marker, '<script setup vapor lang="ts">')
    }`,
  );
});

test('test harness is plain JavaScript and resolves paths under benchmark', () => {
  assert.equal(path.extname(fileURLToPath(import.meta.url)), '.mjs');
  assert.ok(fileURLToPath(helperUrl).startsWith(fileURLToPath(benchmarkRoot)));
});
