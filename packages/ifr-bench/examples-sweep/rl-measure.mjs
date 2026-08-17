/**
 * ReactLynx counterpart of measure-run.mjs — one measured dual-thread run of
 * a ReactLynx .web.bundle in the same PAPI-over-jsdom harness.
 *
 *   node [--jitless] examples-sweep/rl-measure.mjs <bundle.web.bundle>
 *
 * Timeline: MT eval → renderPage (ReactLynx renders the first screen here —
 * its IFR — and emits rLynxFirstScreen) → BG eval (Preact renders silently)
 * → replay of the queued lifecycle events (hydration: id adoption + rLynxChange
 * patch back to MT). On devices the lynx core queues rLynxFirstScreen until
 * the BG thread is ready; the harness buffers it the same way.
 */

import fs from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.join(_dirname, '../../testing-library/package.json'),
);
const { JSDOM } = require('jsdom');
const { LynxTestingEnv } = require('@lynx-js/testing-environment');

const bundlePath = process.argv[2];
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const env = new LynxTestingEnv(jsdom);
globalThis.lynxTestingEnv = env;

const contentSize = () => {
  const page = jsdom.window.document.body.firstElementChild;
  return page ? page.querySelectorAll('*').length : 0;
};

env.switchToMainThread();

const t0 = performance.now();
const mtScript = new vm.Script(`(function(){${bundle.lepusCode.root}\n})()`, {
  filename: 'rl-mt.js',
});
const t0b = performance.now();
mtScript.runInThisContext();

// Buffer MT→BG lifecycle events until the background thread exists (device
// behavior: the engine queues them; the testing env would throw instead).
const queuedLifecycle = [];
const origLifecycle = globalThis.__OnLifecycleEvent;
globalThis.__OnLifecycleEvent = (...args) => {
  queuedLifecycle.push(args);
};

const t1 = performance.now();
globalThis.renderPage({});
const t2 = performance.now();
const contentAtRenderPage = contentSize();

env.switchToBackgroundThread();
let bgError = '';
const t3 = performance.now();
let t3b = t3;
try {
  const bgScript = new vm.Script(
    `(function(){${bundle.manifest['/app-service.js']}\n})()`,
    { filename: 'rl-bg.js' },
  );
  t3b = performance.now();
  bgScript.runInThisContext();
} catch (e) {
  bgError = String(e).slice(0, 200);
}
const t4 = performance.now();

// Deliver the queued lifecycle events (rLynxFirstScreen → hydration → the
// rLynxChange patch flows back to the MT via the env's callLepusMethod).
let hydrateError = '';
try {
  for (const args of queuedLifecycle) {
    globalThis.lynxCoreInject.tt.OnLifecycleEvent(...args);
  }
} catch (e) {
  hydrateError = String(e).slice(0, 200);
}
const t5 = performance.now();

env.switchToMainThread();
globalThis.__OnLifecycleEvent = origLifecycle;

function serialize(node) {
  if (node.nodeType === 3) return JSON.stringify(node.data);
  const attrs = [...(node.attributes ?? [])]
    .map((a) => `${a.name}=${JSON.stringify(a.value)}`)
    .sort()
    .join(' ');
  const kids = [...node.childNodes].map(serialize).filter((s) => s !== '""');
  return `<${node.tagName?.toLowerCase() ?? '?'} ${attrs}>[${kids.join(',')}]`;
}
const doc = serialize(jsdom.window.document.body);

process.stdout.write(
  `${
    JSON.stringify({
      mtParseMs: t0b - t0,
      mtExecMs: t1 - t0b,
      renderPageMs: t2 - t1,
      bgParseMs: t3b - t3,
      bgExecMs: t4 - t3b,
      hydrateMs: t5 - t4,
      contentAtRenderPage,
      contentFinal: contentSize(),
      bgError,
      hydrateError,
      docLen: doc.length,
      doc,
    })
  }\n`,
);
process.exit(0);
