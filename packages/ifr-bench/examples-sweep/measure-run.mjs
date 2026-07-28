/**
 * One measured dual-thread run of a built .web.bundle. Prints a JSON line.
 *
 *   node [--jitless] examples-sweep/measure-run.mjs <bundle.web.bundle>
 *
 * Timeline mirrors a device's loadTemplate sequence:
 *   mtEvalMs      — evaluate the main-thread (lepus) script
 *   renderPageMs  — renderPage(processData({})) (IFR renders content here)
 *   bgMs          — evaluate the background script: user code mounts, first
 *                   batch flushes through callLepusMethod → vuePatchUpdate →
 *                   interpreter (or IFR hydration skip)
 *
 * FCP proxy  = mt+render (+bg when no content painted at renderPage)
 * TTI proxy  = mt+render+bg (BG handlers registered; events routable)
 *
 * In-process the cross-thread call is synchronous, so real IPC/thread-startup
 * latency (which only penalizes the non-IFR path) is NOT included — the
 * measured FCP gap is a lower bound for devices.
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

// LynxTestingEnv projects each simulated realm onto Node's shared global
// object. It overwrites globals known to the target realm, but cannot remove
// extra properties installed by code evaluated in the previous realm. Vapor
// intentionally installs DOM constructor shims and IFR bridge state at module
// evaluation time, so leaking the MT copies into BG makes the BG render reuse
// MT-only ShadowElement classes/counters and produces an empty/invalid stream.
// Capture the pristine BG values before MT evaluation and restore them at the
// realm boundary, matching the isolated globals used by a real Lynx device.
const VAPOR_REALM_GLOBALS = [
  '__VUE_LYNX_DOCUMENT__',
  '__VUE_LYNX_WINDOW__',
  'document',
  'window',
  'Node',
  'Element',
  'Text',
  'Comment',
  'CharacterData',
  'DocumentFragment',
  'HTMLElement',
  'SVGElement',
  'MathMLElement',
  'HTMLSlotElement',
  'ShadowRoot',
  '__VUE_LYNX_IFR_MT__',
  '__VUE_LYNX_IFR_ENABLED__',
  '__vueLynxIfrApplyOps',
  '__vueLynxIfrMountApps',
  '__vueLynxIfrSealOps',
  '__VUE_LYNX_EVENT_REGISTRY__',
];

function captureRealmGlobals() {
  return new Map(
    VAPOR_REALM_GLOBALS.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
}

function restoreRealmGlobals(snapshot) {
  for (const [name, descriptor] of snapshot) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

const bundlePath = process.argv[2];
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const env = new LynxTestingEnv(jsdom);
globalThis.lynxTestingEnv = env;
// The constructor leaves the BG realm active.
const backgroundRealmGlobals = captureRealmGlobals();

const contentSize = () => {
  // Count element nodes beneath <page> — raw placeholder texts excluded.
  const page = jsdom.window.document.body.firstElementChild;
  return page ? page.querySelectorAll('*').length : 0;
};

env.switchToMainThread();
// Parse (compile) and execute measured separately: lepus is precompiled to
// bytecode at build time on devices, so parse cost does not exist there.
const t0 = performance.now();
const mtScript = new vm.Script(`(function(){${bundle.lepusCode.root}\n})()`, {
  filename: 'mt.js',
});
const t0b = performance.now();
mtScript.runInThisContext();
const t1 = performance.now();
globalThis.renderPage(globalThis.processData({}));
const t2 = performance.now();
const contentAtRenderPage = contentSize();

// Wrap vuePatchUpdate to observe the first ops batch (payload + count).
let firstBatchBytes = 0;
let batches = 0;
const origPatch = globalThis.vuePatchUpdate;
globalThis.vuePatchUpdate = (params) => {
  batches++;
  if (batches === 1) firstBatchBytes = params.data.length;
  return origPatch(params);
};

env.switchToBackgroundThread();
restoreRealmGlobals(backgroundRealmGlobals);
// Post-first-frame APIs the minimal env lacks; apps touch them in onMounted.
if (globalThis.lynx && !globalThis.lynx.createSelectorQuery) {
  globalThis.lynx.createSelectorQuery = () => {
    const chain = {
      select: () => chain,
      invoke: () => chain,
      setNativeProps: () => chain,
      fields: () => chain,
      path: () => chain,
      exec() {
        // The fixture only exercises the selector chain's synchronous shape.
      },
    };
    return chain;
  };
}
let bgError = '';
const t3 = performance.now();
let t3b = t3;
try {
  const bgScript = new vm.Script(
    `(function(){${bundle.manifest['/app-service.js']}\n})()`,
    { filename: 'bg.js' },
  );
  t3b = performance.now();
  bgScript.runInThisContext();
} catch (e) {
  bgError = String(e).slice(0, 160);
}
const t4 = performance.now();

env.switchToMainThread();
function serialize(node) {
  if (node.nodeType === 3) return JSON.stringify(node.data);
  const attrs = [...(node.attributes ?? [])]
    .filter((a) => !a.name.startsWith('vue-ref-'))
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
      mtEvalMs: t1 - t0,
      mtParseMs: t0b - t0,
      mtExecMs: t1 - t0b,
      renderPageMs: t2 - t1,
      bgMs: t4 - t3,
      bgParseMs: t3b - t3,
      bgExecMs: t4 - t3b,
      contentAtRenderPage,
      contentFinal: contentSize(),
      firstBatchBytes,
      batches,
      bgError,
      docLen: doc.length,
      doc,
    })
  }\n`,
);
process.exit(0);
