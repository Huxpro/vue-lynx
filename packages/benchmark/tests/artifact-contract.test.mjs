import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPrefix = 'vue-lynx-bench-artifact-v1|';
const bundleNames = ['main.web.bundle', 'main.lynx.bundle'];
const vueRspeedy = path.join(root, 'node_modules/.bin/rspeedy');
const reactRspeedy = path.join(
  root,
  'apps/ui-react/node_modules/.bin/rspeedy',
);

const formalBuilds = [
  {
    name: 'React rows 11',
    app: 'ui-react',
    dist: 'dist',
    bin: reactRspeedy,
    env: { BENCH_AUTOROWS: '11' },
    marker: `${contractPrefix}mode=react|rows=11|ifr=0|et=0`,
  },
  {
    name: 'VDOM off rows 13',
    app: 'ui-vdom',
    dist: 'dist',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '13', BENCH_CELL: 'off' },
    marker: `${contractPrefix}mode=vdom|rows=13|ifr=0|et=0`,
  },
  {
    name: 'VDOM IFR+ET rows 17',
    app: 'ui-vdom',
    dist: 'dist-ifr-et',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '17', BENCH_CELL: 'ifr-et' },
    marker: `${contractPrefix}mode=vdom-ifr-et|rows=17|ifr=1|et=1`,
  },
  {
    name: 'Vapor off rows 19',
    app: 'ui-vapor',
    dist: 'dist',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '19', BENCH_CELL: 'off' },
    marker: `${contractPrefix}mode=vapor|rows=19|ifr=0|et=0`,
  },
  {
    name: 'Vapor IFR rows 23',
    app: 'ui-vapor',
    dist: 'dist-ifr',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '23', BENCH_CELL: 'ifr' },
    marker: `${contractPrefix}mode=vapor-ifr|rows=23|ifr=1|et=0`,
  },
];

const cacheSequence = [
  {
    name: 'VDOM cache sequence off rows 41',
    app: 'ui-vdom',
    dist: 'dist',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '41', BENCH_CELL: 'off' },
    marker: `${contractPrefix}mode=vdom|rows=41|ifr=0|et=0`,
  },
  {
    name: 'VDOM cache sequence IFR+ET rows 43',
    app: 'ui-vdom',
    dist: 'dist-ifr-et',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '43', BENCH_CELL: 'ifr-et' },
    marker: `${contractPrefix}mode=vdom-ifr-et|rows=43|ifr=1|et=1`,
  },
  {
    name: 'VDOM cache sequence off rows 47',
    app: 'ui-vdom',
    dist: 'dist',
    bin: vueRspeedy,
    env: { BENCH_AUTOROWS: '47', BENCH_CELL: 'off' },
    marker: `${contractPrefix}mode=vdom|rows=47|ifr=0|et=0`,
  },
];

function byteCount(haystack, needle) {
  const needleBytes = Buffer.from(needle);
  let count = 0;
  for (
    let offset = 0;
    (offset = haystack.indexOf(needleBytes, offset)) !== -1;
    offset += needleBytes.length
  ) {
    count++;
  }
  return count;
}

function clearBuild(build, { cache }) {
  const appRoot = path.join(root, 'apps', build.app);
  if (cache) {
    fs.rmSync(path.join(appRoot, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
  }
  fs.rmSync(path.join(appRoot, build.dist), { recursive: true, force: true });
}

function buildAndAssert(build) {
  const appRoot = path.join(root, 'apps', build.app);
  execFileSync(build.bin, ['build'], {
    cwd: appRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ...build.env,
    },
    stdio: 'pipe',
  });

  for (const bundleName of bundleNames) {
    const bundle = fs.readFileSync(path.join(appRoot, build.dist, bundleName));
    assert.equal(
      byteCount(bundle, contractPrefix),
      1,
      `${build.name} ${bundleName} v1 marker count`,
    );
    assert.equal(
      byteCount(bundle, build.marker),
      1,
      `${build.name} ${bundleName} exact marker bytes`,
    );
    assert.equal(
      byteCount(bundle, `/*! ${build.marker} */`),
      1,
      `${build.name} ${bundleName} static banner comment`,
    );
  }
}

test('all formal bundles contain one exact static artifact marker', () => {
  for (const build of formalBuilds) {
    clearBuild(build, { cache: true });
    buildAndAssert(build);
  }
});

test('VDOM persistent cache never reuses stale artifact metadata', () => {
  clearBuild(cacheSequence[0], { cache: true });
  fs.rmSync(path.join(root, 'apps/ui-vdom/dist-ifr-et'), {
    recursive: true,
    force: true,
  });

  for (const build of cacheSequence) {
    clearBuild(build, { cache: false });
    buildAndAssert(build);
  }
});
