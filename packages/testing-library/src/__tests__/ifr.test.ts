/**
 * IFR (Instant First-Frame Rendering) integration tests.
 *
 * Simulates the dual-thread IFR flow inside the shared-globalThis testing
 * environment:
 *
 *   MT phase:  enableIFR() → createApp().mount() defers → renderPage() runs
 *              the deferred mount on the "main thread"; the runtime's flush
 *              hands ops to the IFR recorder which applies them locally via
 *              PAPI → JSDOM shows the first frame before any BG code ran.
 *
 *   BG phase:  clear the MT flag and reset runtime module state (on a real
 *              device the background thread is a separate JS context with
 *              fresh module instances), then mount the same component again.
 *              The flush goes through callLepusMethod('vuePatchUpdate'),
 *              where interceptPatchUpdate() hydrates: identical batches are
 *              skipped, value diffs are patched, structural diffs tear the
 *              IFR tree down and re-apply.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  createApp,
  onMounted,
  Suspense,
  defineAsyncComponent,
  registerElementTemplate,
  resetForTesting,
} from 'vue-lynx';
import type { Component } from 'vue-lynx';
import {
  enableIFR,
  getIfrPhase,
  resetIfrForTesting,
} from '../../../vue-lynx/main-thread/src/ifr.js';
import { fireEvent } from '../fire-event.js';
import { waitForUpdate } from '../render.js';

const env = () => (globalThis as any).lynxTestingEnv;

/** Phase 1: main-thread first-screen render via renderPage. */
function mtFirstScreenRender(comp: Component): Document {
  const e = env();
  e.switchToMainThread();
  const doc = e.env.window.document as Document;
  doc.body.innerHTML = '';

  resetForTesting();
  resetIfrForTesting();
  enableIFR();

  // User code: mount() is deferred because __VUE_LYNX_IFR_MT__ is set.
  createApp(comp).mount();
  expect(doc.body.firstElementChild).toBeNull(); // nothing painted yet

  // Lynx engine calls renderPage during loadTemplate → IFR render happens
  // synchronously inside it.
  (globalThis as any).renderPage({});
  return doc;
}

/** Phase 2: background thread boots, renders the same app, hydrates. */
function bgHydrate(comp: Component): void {
  const e = env();
  // On a real device each thread has its own globalThis; in this shared
  // environment we clear the MT-only flag before running BG code.
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
  e.switchToBackgroundThread();
  // Fresh BG context: ShadowElement ids, event signs, and the ops buffer
  // restart exactly like a real background-thread boot.
  resetForTesting();
  createApp(comp).mount();
}

beforeEach(() => {
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
});

describe('IFR first-screen render (main thread)', () => {
  it('paints the first frame during renderPage, before any BG code', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [h('text', null, 'instant frame')]);
      },
    });

    const doc = mtFirstScreenRender(Comp);

    expect(doc.querySelector('text')?.textContent).toBe('instant frame');
    expect(getIfrPhase()).toBe('rendered');
  });

  it('does not run onMounted during the main-thread render', () => {
    let mountedCalls = 0;
    const Comp = defineComponent({
      setup() {
        onMounted(() => {
          mountedCalls++;
        });
        return () => h('text', null, 'x');
      },
    });

    mtFirstScreenRender(Comp);
    expect(mountedCalls).toBe(0);

    bgHydrate(Comp);
    expect(mountedCalls).toBe(1);
  });
});

describe('IFR hydration (background thread)', () => {
  it('skips the identical background batch without duplicating elements', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('text', null, 'one'),
          h('text', null, 'two'),
        ]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    bgHydrate(Comp);

    expect(getIfrPhase()).toBe('hydrated');
    env().switchToMainThread();
    expect(doc.querySelectorAll('view').length).toBe(1);
    const texts = doc.querySelectorAll('text');
    expect(texts.length).toBe(2);
    expect(texts[0]!.textContent).toBe('one');
    expect(texts[1]!.textContent).toBe('two');
  });

  it('routes events to BG handlers bound during the main-thread render', async () => {
    const Comp = defineComponent({
      setup() {
        const count = ref(0);
        return () =>
          h('view', { onTap: () => count.value++ }, [
            h('text', null, `count:${count.value}`),
          ]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    bgHydrate(Comp);
    expect(getIfrPhase()).toBe('hydrated');

    env().switchToMainThread();
    const view = doc.querySelector('view')!;
    // The listener was attached by the MT IFR render with sign "vue:0";
    // the BG render registered its handler under the same deterministic sign.
    fireEvent.tap(view);
    await waitForUpdate();

    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('count:1');
  });

  it('applies post-hydration updates (e.g. from onMounted) normally', async () => {
    const Comp = defineComponent({
      setup() {
        const label = ref('first');
        onMounted(() => {
          label.value = 'mounted';
        });
        return () => h('text', null, label.value);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('first');

    bgHydrate(Comp);
    await waitForUpdate();

    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('mounted');
    expect(doc.querySelectorAll('text').length).toBe(1);
    expect(getIfrPhase()).toBe('hydrated');
  });

  it('patches value-level mismatches in place', async () => {
    // Module-level mutable state → the two threads render different text
    // with the same structure.
    const state = { label: 'from-main-thread', color: 'red' };
    const Comp = defineComponent({
      render() {
        return h('view', { style: { color: state.color } }, [
          h('text', null, state.label),
        ]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('from-main-thread');

    state.label = 'from-background';
    state.color = 'blue';
    bgHydrate(Comp);

    expect(getIfrPhase()).toBe('hydrated');
    env().switchToMainThread();
    // No teardown: still exactly one view/text, values patched.
    expect(doc.querySelectorAll('view').length).toBe(1);
    expect(doc.querySelectorAll('text').length).toBe(1);
    expect(doc.querySelector('text')?.textContent).toBe('from-background');
  });

  it('tears down and re-renders on structural mismatch', () => {
    const CompA = defineComponent({
      render() {
        return h('view', null, [h('text', null, 'main-thread tree')]);
      },
    });
    const CompB = defineComponent({
      render() {
        return h('view', null, [
          h('image', { src: 'x.png' }),
          h('text', null, 'background tree'),
        ]);
      },
    });

    const doc = mtFirstScreenRender(CompA);
    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('main-thread tree');

    // The BG render diverges structurally → hydration falls back.
    bgHydrate(CompB);

    expect(getIfrPhase()).toBe('hydrated');
    env().switchToMainThread();
    expect(doc.querySelectorAll('view').length).toBe(1);
    expect(doc.querySelectorAll('image').length).toBe(1);
    expect(doc.querySelectorAll('text').length).toBe(1);
    expect(doc.querySelector('text')?.textContent).toBe('background tree');
  });
});

describe('IFR + element templates', () => {
  it('hydrates INSTANTIATE_TEMPLATE batches without re-instantiating', async () => {
    const tpl = registerElementTemplate('ifr-tpl', ['#text', 'onTap'], (P: number) => {
      const e0 = __CreateView(P);
      __SetCSSId([e0], 0);
      __SetClasses(e0, 'card');
      const e1 = __CreateText(P);
      __SetCSSId([e1], 0);
      __SetClasses(e1, 'label');
      __AppendElement(e0, e1);
      const e2 = __CreateView(P);
      __SetCSSId([e2], 0);
      __SetClasses(e2, 'btn');
      __AppendElement(e0, e2);
      return [e0, e1, e2];
    });
    const Comp = defineComponent({
      setup() {
        const n = ref(0);
        return () =>
          h('view', { class: 'wrap' }, [
            h(`__vlx-tpl:${tpl}`, {
              __h0: `n:${n.value}`,
              __h1: () => n.value++,
            }),
          ]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    expect(doc.querySelector('.label')?.textContent).toBe('n:0');

    bgHydrate(Comp);
    expect(getIfrPhase()).toBe('hydrated');

    env().switchToMainThread();
    // Skipped, not re-applied: exactly one template instance.
    expect(doc.querySelectorAll('.card').length).toBe(1);
    expect(doc.querySelectorAll('.label').length).toBe(1);

    // Events bound through template holes route to the BG handler.
    fireEvent.tap(doc.querySelector('.btn')!);
    await waitForUpdate();
    env().switchToMainThread();
    expect(doc.querySelector('.label')?.textContent).toBe('n:1');
  });
});

describe('IFR + Suspense', () => {
  it('keeps the tree when async components resolve around hydration', async () => {
    // Reproduces the docs suspense regression: setup-time async work runs on
    // the IFR main-thread Vue app after the sync first paint. If those resolve
    // batches are recorded, BG hydration can structurally mismatch, tear down
    // the IFR tree, and apply only an incremental swap → blank page.
    //
    // Build separate component trees for MT vs BG so each thread gets its own
    // defineAsyncComponent cache (real devices are separate JS contexts; this
    // shared-globalThis harness would otherwise reuse a resolved loader).
    function makeComp() {
      const Child = defineComponent({
        setup() {
          return () => h('text', null, 'resolved');
        },
      });
      const AsyncChild = defineAsyncComponent(
        () =>
          new Promise<typeof Child>((resolve) => {
            setTimeout(() => resolve(Child), 30);
          }),
      );
      return defineComponent({
        setup() {
          return () =>
            h(Suspense, null, {
              default: () => h(AsyncChild),
              fallback: () => h('text', null, 'loading'),
            });
        },
      });
    }

    const warnings: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
      origWarn.apply(console, args as []);
    };

    try {
      const doc = mtFirstScreenRender(makeComp());
      env().switchToMainThread();
      expect(doc.querySelector('text')?.textContent).toBe('loading');
      expect(getIfrPhase()).toBe('rendered');

      // Let the MT async loader resolve *before* BG hydrates — the race that
      // used to append a second recorded batch and wipe the tree on mismatch.
      await new Promise((r) => setTimeout(r, 50));
      env().switchToMainThread();
      // Snapshot is frozen: still showing the sync first-screen fallback.
      expect(doc.querySelector('text')?.textContent).toBe('loading');
      expect(getIfrPhase()).toBe('rendered');

      bgHydrate(makeComp());
      await waitForUpdate();
      // BG's initial fallback batch hydrates against the sealed snapshot.
      expect(getIfrPhase()).toBe('hydrated');
      expect(
        warnings.some((w) => w.includes('IFR hydration mismatch')),
      ).toBe(false);

      await new Promise((r) => setTimeout(r, 50));
      await waitForUpdate();

      env().switchToMainThread();
      expect(doc.querySelectorAll('text').length).toBe(1);
      expect(doc.querySelector('text')?.textContent).toBe('resolved');
    } finally {
      console.warn = origWarn;
    }
  });
});

describe('non-IFR builds are unaffected', () => {
  it('renderPage + vuePatchUpdate behave as before when enableIFR never ran', () => {
    resetIfrForTesting();

    const e = env();
    e.switchToMainThread();
    const doc = e.env.window.document as Document;
    doc.body.innerHTML = '';
    (globalThis as any).renderPage({});

    e.switchToBackgroundThread();
    resetForTesting();
    const Comp = defineComponent({
      render() {
        return h('text', null, 'classic pipeline');
      },
    });
    createApp(Comp).mount(); // mounts immediately — no IFR flag

    e.switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('classic pipeline');
    expect(getIfrPhase()).toBe('inactive');
  });
});
