/**
 * PAPI backends for the benchmark.
 *
 *  - counting stub: minimal in-memory elements + call counters. Isolates the
 *    framework-side JS cost (what the variants differ in) from fake-DOM cost.
 *  - jsdom: @lynx-js/testing-environment's PAPI over a real jsdom document —
 *    the correctness oracle (variants must produce identical HTML).
 *
 * Both are installed by assigning the __* functions onto globalThis, exactly
 * how lepus exposes PAPI.
 */

const PAPI_NAMES = [
  '__CreatePage',
  '__CreateView',
  '__CreateText',
  '__CreateImage',
  '__CreateScrollView',
  '__CreateElement',
  '__CreateRawText',
  '__AppendElement',
  '__InsertElementBefore',
  '__RemoveElement',
  '__SetAttribute',
  '__SetClasses',
  '__SetInlineStyles',
  '__SetID',
  '__SetCSSId',
  '__AddEvent',
  '__GetElementUniqueID',
  '__FlushElementTree',
];

// ---------------------------------------------------------------------------
// Counting stub
// ---------------------------------------------------------------------------

export function makeCountingBackend() {
  const counters = { create: 0, insert: 0, setattr: 0, event: 0, flush: 0 };
  let uid = 1;

  const mk = (tag) => {
    counters.create++;
    // Small realistic object so allocation cost is represented.
    return { tag, uid: uid++, at: null, cls: '', st: null, ch: null };
  };

  const backend = {
    __CreatePage: () => mk('page'),
    __CreateView: () => mk('view'),
    __CreateText: () => mk('text'),
    __CreateImage: () => mk('image'),
    __CreateScrollView: () => mk('scroll-view'),
    __CreateElement: (tag) => mk(tag),
    __CreateRawText: () => mk('raw-text'),
    __AppendElement: (p, c) => {
      counters.insert++;
      (p.ch ?? (p.ch = [])).push(c);
    },
    __InsertElementBefore: (p, c, ref) => {
      counters.insert++;
      const arr = p.ch ?? (p.ch = []);
      const i = arr.indexOf(ref);
      if (i === -1) arr.push(c);
      else arr.splice(i, 0, c);
    },
    __RemoveElement: (p, c) => {
      const arr = p.ch;
      if (arr) {
        const i = arr.indexOf(c);
        if (i !== -1) arr.splice(i, 1);
      }
    },
    __SetAttribute: (el, k, v) => {
      counters.setattr++;
      (el.at ?? (el.at = {}))[k] = v;
    },
    __SetClasses: (el, cls) => {
      counters.setattr++;
      el.cls = cls;
    },
    __SetInlineStyles: (el, st) => {
      counters.setattr++;
      el.st = st;
    },
    __SetID: (el, id) => {
      el.id = id;
    },
    __SetCSSId: () => {},
    __AddEvent: (el, _t, _n, _h) => {
      counters.event++;
    },
    __GetElementUniqueID: (el) => el.uid,
    __FlushElementTree: () => {
      counters.flush++;
    },
  };

  return {
    kind: 'counting',
    counters,
    install() {
      for (const n of PAPI_NAMES) globalThis[n] = backend[n];
    },
    reset() {
      counters.create = counters.insert = counters.setattr = counters.event = counters.flush = 0;
      uid = 1;
    },
  };
}

// ---------------------------------------------------------------------------
// jsdom backend (correctness oracle)
// ---------------------------------------------------------------------------

export async function makeJsdomBackend() {
  const { JSDOM } = await import('jsdom');
  const { LynxTestingEnv } = await import('@lynx-js/testing-environment');
  const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const env = new LynxTestingEnv({ window: jsdom.window });
  globalThis.lynxTestingEnv = env;
  env.switchToMainThread();

  return {
    kind: 'jsdom',
    env,
    document: jsdom.window.document,
    install() {
      env.switchToMainThread();
    },
    reset() {
      jsdom.window.document.body.innerHTML = '';
    },
    html() {
      return jsdom.window.document.body.innerHTML;
    },
  };
}

/** Normalize HTML for cross-variant comparison (bookkeeping attrs differ by design). */
export function normalizeHtml(html) {
  return html
    .replace(/ vue-ref-\d+="[^"]*"/g, '')
    // Vue's fragment machinery uses empty text nodes as position anchors
    // (hostCreateText('')). They are invisible zero-size placeholders; the
    // lowered variants intentionally don't emit them.
    .replace(/<text><\/text>/g, '')
    // collapse incidental whitespace differences between variants.
    .replace(/\s+</g, '<');
}
