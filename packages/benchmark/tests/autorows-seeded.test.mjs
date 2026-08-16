import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import ts from 'typescript';

const root = new URL('../', import.meta.url);
const vueDataUrl = new URL('shared/data.ts', root);
const reactDataUrl = new URL('apps/ui-react/src/data.ts', root);
const vdomAppUrl = new URL('apps/ui-vdom/src/App.vue', root);
const vaporAppUrl = new URL('apps/ui-vapor/src/App.vue', root);
const reactAppUrl = new URL('apps/ui-react/src/App.tsx', root);

const SEED = 42;
const COUNTS = [0, 1000, 10000, 30000];
const EXPECTED_PAYLOAD_HASHES = {
  0: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  1000: '1b5f13d049293c125b795a92b6182ed2dd03aa0b8297f2649c4bc41b7313f878',
  10000: 'e22209431a0098d3289afc8d0bff7dc690d723bf49ebffa79db535b7b4811fd7',
  30000: 'e27a45678701a7e356a0a755ae0fd48eec369ddf2771e4a6518d949cf826c95a',
};

function compileDataModule(url) {
  const source = fs.readFileSync(url, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: url.pathname,
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(errors, []);
  return result.outputText;
}

const compiledModules = {
  vue: compileDataModule(vueDataUrl),
  react: compileDataModule(reactDataUrl),
};

function loadDataModule(kind, random = Math.random) {
  const module = { exports: {} };
  const context = vm.createContext({
    __random: random,
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === 'vue') {
        return { shallowRef: value => ({ value }) };
      }
      throw new Error(`Unexpected import in ${kind} data module: ${specifier}`);
    },
  });
  vm.runInContext('Math.random = () => __random()', context);
  new vm.Script(compiledModules[kind], {
    filename: kind === 'vue' ? vueDataUrl.pathname : reactDataUrl.pathname,
  }).runInContext(context);
  return module.exports;
}

function rowPayload(rows, kind) {
  return Array.from(rows, row => ({
    id: Number(row.id),
    label: String(kind === 'vue' ? row.label.value : row.label),
  }));
}

function payloadHash(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

const realms = [
  ['VDOM Web BG', 'vue'],
  ['VDOM Native BG', 'vue'],
  ['VDOM Web MT', 'vue'],
  ['VDOM Native MT', 'vue'],
  ['Vapor Web BG', 'vue'],
  ['Vapor Native BG', 'vue'],
  ['Vapor Web MT', 'vue'],
  ['Vapor Native MT', 'vue'],
  ['React Web BG', 'react'],
  ['React Native BG', 'react'],
  ['React Web MT', 'react'],
  ['React Native MT', 'react'],
];

test('seeded initial payloads match exactly across frameworks and fresh realms', () => {
  for (const count of COUNTS) {
    let expected;
    for (const [name, kind] of realms) {
      const data = loadDataModule(kind);
      const payload = rowPayload(data.buildDataSeeded(count, SEED), kind);
      if (expected === undefined) expected = payload;
      else assert.deepEqual(payload, expected, `${name}, ${count} rows`);
    }
    assert.equal(payloadHash(expected), EXPECTED_PAYLOAD_HASHES[count]);
  }
});

test('seeded generation has call-local PRNG state and reserves global row IDs', () => {
  for (const kind of ['vue', 'react']) {
    let randomCalls = 0;
    const data = loadDataModule(kind, () => {
      randomCalls++;
      return 0;
    });
    const first = rowPayload(data.buildDataSeeded(4, SEED), kind);
    const second = rowPayload(data.buildDataSeeded(4, SEED), kind);
    const different = rowPayload(data.buildDataSeeded(4, SEED + 1), kind);

    assert.equal(randomCalls, 0);
    assert.deepEqual(first.map(row => row.id), [1, 2, 3, 4]);
    assert.deepEqual(second.map(row => row.id), [5, 6, 7, 8]);
    assert.deepEqual(
      second.map(row => row.label),
      first.map(row => row.label),
    );
    assert.notDeepEqual(
      different.map(row => row.label),
      first.map(row => row.label),
    );
    assert.deepEqual(rowPayload(data.buildData(1), kind), [
      { id: 13, label: 'pretty red table' },
    ]);
    assert.equal(randomCalls, 3);
  }
});

test('ordinary buildData keeps its default API and Math.random behavior', () => {
  for (const kind of ['vue', 'react']) {
    let randomCalls = 0;
    const values = [0, 0.5, 0.999];
    const data = loadDataModule(kind, () => values[randomCalls++ % values.length]);

    assert.equal(data.buildData.length, 0);
    assert.equal(data.buildDataSeeded.length, 2);

    const defaultRows = rowPayload(data.buildData(), kind);
    assert.equal(defaultRows.length, 1000);
    assert.deepEqual(defaultRows[0], { id: 1, label: 'pretty brown mouse' });
    assert.deepEqual(defaultRows.at(-1), {
      id: 1000,
      label: 'pretty brown mouse',
    });
    assert.equal(randomCalls, 3000);

    const explicitRows = rowPayload(data.buildData(2), kind);
    assert.deepEqual(explicitRows, [
      { id: 1001, label: 'pretty brown mouse' },
      { id: 1002, label: 'pretty brown mouse' },
    ]);
    assert.equal(randomCalls, 3006);
  }
});

test('only BENCH_AUTOROWS initialization uses the fixed seeded builder', () => {
  const vdom = fs.readFileSync(vdomAppUrl, 'utf8');
  const vapor = fs.readFileSync(vaporAppUrl, 'utf8');
  const react = fs.readFileSync(reactAppUrl, 'utf8');
  const generatedVapor = `<!-- GENERATED from apps/ui-vdom/src/App.vue — do not edit -->\n${
    vdom.replace(
      '<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">',
      '<script setup vapor lang="ts">',
    )
  }`;

  assert.equal(vapor, generatedVapor);
  for (const source of [vdom, vapor, react]) {
    assert.match(source, /const INITIAL_ROWS_SEED = 42/);
    assert.match(
      source,
      /buildDataSeeded\(__BENCH_AUTOROWS__, INITIAL_ROWS_SEED\)/,
    );
    assert.equal(source.match(/\bbuildDataSeeded\(/g)?.length, 1);
  }

  const expectedInteractiveCounts = ['', '10000', '3000', '5000', '20000', '30000', '1000'];
  for (const [name, source] of [['VDOM', vdom], ['Vapor', vapor], ['React', react]]) {
    const interactiveSource = source.slice(
      source.indexOf(name === 'React' ? 'const run = ' : 'function run()'),
    );
    assert.doesNotMatch(interactiveSource, /\bbuildDataSeeded\(/);
    assert.deepEqual(
      Array.from(interactiveSource.matchAll(/\bbuildData\((\d*)\)/g), match => match[1]),
      expectedInteractiveCounts,
      name,
    );
  }
});
