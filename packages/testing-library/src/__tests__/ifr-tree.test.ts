/**
 * IFR tree handover (`ifrHandover: 'tree'`, D1) integration tests.
 *
 * Same dual-thread simulation as `ifr.test.ts`, but hydration adopts painted
 * elements through a structural match instead of comparing the background
 * stream against a recorded op stream. What these tests pin down that the
 * stream path cannot do:
 *
 *  - structural divergence costs the diverging nodes, NOT the page: the shared
 *    prefix keeps its element identity across hydration;
 *  - a non-deterministic first screen is correct, not merely recoverable;
 *  - painted nodes the background never claims are swept.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  createApp,
  onMounted,
  registerElementTemplate,
  resetForTesting,
} from 'vue-lynx';
import type { Component } from 'vue-lynx';
import {
  completeIfrHydration,
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
  const doc = e.jsdom.window.document as Document;
  doc.body.innerHTML = '';

  resetForTesting();
  resetIfrForTesting();
  (globalThis as any).__VUE_LYNX_IFR_HANDOVER__ = 'tree';
  enableIFR();

  createApp(comp).mount();
  expect(doc.body.firstElementChild).toBeNull();

  (globalThis as any).renderPage({});
  return doc;
}

/**
 * Phase 2: background thread boots, renders, hydrates. The completion signal
 * is what the BG IFR entry sends (`vueIfrHydrationComplete`) once its initial
 * stream has been flushed — tree handover sweeps unclaimed nodes there.
 */
function bgHydrate(comp: Component): void {
  const e = env();
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
  e.switchToBackgroundThread();
  resetForTesting();
  createApp(comp).mount();
  completeIfrHydration();
}

beforeEach(() => {
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
  (globalThis as any).__VUE_LYNX_IFR_HANDOVER__ = 'tree';
});

afterEach(() => {
  delete (globalThis as any).__VUE_LYNX_IFR_HANDOVER__;
});

describe('IFR tree handover — identical renders', () => {
  it('adopts the painted tree without duplicating elements', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [
          h('text', null, 'one'),
          h('text', null, 'two'),
        ]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    const paintedView = doc.querySelector('view')!;

    bgHydrate(Comp);

    expect(getIfrPhase()).toBe('hydrated');
    env().switchToMainThread();
    expect(doc.querySelectorAll('view').length).toBe(1);
    // Adopted, not rebuilt: the very same element object survived hydration.
    expect(doc.querySelector('view')).toBe(paintedView);
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

    env().switchToMainThread();
    fireEvent.tap(doc.querySelector('view')!);
    await waitForUpdate();

    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('count:1');
  });

  it('applies post-hydration updates normally', async () => {
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
  });
});

describe('IFR tree handover — divergence is local', () => {
  it('patches value mismatches on adopted elements', () => {
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
    const paintedView = doc.querySelector('view')!;

    state.label = 'from-background';
    state.color = 'blue';
    bgHydrate(Comp);

    env().switchToMainThread();
    expect(doc.querySelectorAll('view').length).toBe(1);
    expect(doc.querySelectorAll('text').length).toBe(1);
    expect(doc.querySelector('view')).toBe(paintedView);
    expect(doc.querySelector('text')?.textContent).toBe('from-background');
  });

  it('keeps the shared prefix when the background renders an extra child', () => {
    const CompA = defineComponent({
      render() {
        return h('view', null, [h('text', null, 'shared')]);
      },
    });
    const CompB = defineComponent({
      render() {
        return h('view', null, [
          h('text', null, 'shared'),
          h('image', { src: 'x.png' }),
        ]);
      },
    });

    const doc = mtFirstScreenRender(CompA);
    env().switchToMainThread();
    const paintedView = doc.querySelector('view')!;
    const paintedText = doc.querySelector('text')!;

    bgHydrate(CompB);

    env().switchToMainThread();
    // The stream handover would have torn the page down here. Adoption keeps
    // both painted elements and only creates the new one.
    expect(doc.querySelector('view')).toBe(paintedView);
    expect(doc.querySelector('text')).toBe(paintedText);
    expect(doc.querySelectorAll('view').length).toBe(1);
    expect(doc.querySelectorAll('text').length).toBe(1);
    expect(doc.querySelectorAll('image').length).toBe(1);
    const kids = paintedView.children;
    expect(kids[0]!.tagName.toLowerCase()).toBe('text');
    expect(kids[1]!.tagName.toLowerCase()).toBe('image');
  });

  it('sweeps painted nodes the background never claims', () => {
    const CompA = defineComponent({
      render() {
        return h('view', null, [
          h('text', null, 'kept'),
          h('image', { src: 'gone.png' }),
        ]);
      },
    });
    const CompB = defineComponent({
      render() {
        return h('view', null, [h('text', null, 'kept')]);
      },
    });

    const doc = mtFirstScreenRender(CompA);
    env().switchToMainThread();
    expect(doc.querySelectorAll('image').length).toBe(1);
    const paintedView = doc.querySelector('view')!;

    bgHydrate(CompB);

    env().switchToMainThread();
    expect(doc.querySelector('view')).toBe(paintedView);
    expect(doc.querySelectorAll('image').length).toBe(0);
    expect(doc.querySelectorAll('text').length).toBe(1);
  });

  it('produces the correct tree when the two renders order children differently', () => {
    const CompA = defineComponent({
      render() {
        return h('view', null, [
          h('text', null, 'a'),
          h('image', { src: 'b.png' }),
        ]);
      },
    });
    const CompB = defineComponent({
      render() {
        return h('view', null, [
          h('image', { src: 'b.png' }),
          h('text', null, 'a'),
        ]);
      },
    });

    const doc = mtFirstScreenRender(CompA);
    bgHydrate(CompB);

    env().switchToMainThread();
    const view = doc.querySelector('view')!;
    expect(doc.querySelectorAll('view').length).toBe(1);
    expect(view.children.length).toBe(2);
    expect(view.children[0]!.tagName.toLowerCase()).toBe('image');
    expect(view.children[1]!.tagName.toLowerCase()).toBe('text');
    expect(view.children[1]!.textContent).toBe('a');
  });

  it('rebuilds only the diverging root, not the siblings', () => {
    const CompA = defineComponent({
      render() {
        return h('view', { class: 'root' }, [
          h('view', { class: 'first' }, [h('text', null, 'one')]),
          h('view', { class: 'second' }, [h('text', null, 'two')]),
        ]);
      },
    });
    const CompB = defineComponent({
      render() {
        return h('view', { class: 'root' }, [
          h('view', { class: 'first' }, [h('text', null, 'one')]),
          h('view', { class: 'second' }, [h('image', { src: 'z.png' })]),
        ]);
      },
    });

    const doc = mtFirstScreenRender(CompA);
    env().switchToMainThread();
    const paintedFirst = doc.querySelector('.first')!;
    const paintedSecond = doc.querySelector('.second')!;

    bgHydrate(CompB);

    env().switchToMainThread();
    // `.first` and `.second` are both adopted; only `.second`'s child diverges.
    expect(doc.querySelector('.first')).toBe(paintedFirst);
    expect(doc.querySelector('.second')).toBe(paintedSecond);
    expect(paintedFirst.textContent).toBe('one');
    expect(paintedSecond.querySelectorAll('image').length).toBe(1);
    expect(paintedSecond.querySelectorAll('text').length).toBe(0);
  });
});

describe('IFR tree handover — non-deterministic first screens', () => {
  it('is correct when the first screen renders a different value each pass', () => {
    let pass = 0;
    const Comp = defineComponent({
      render() {
        // The classic forbidden pattern under stream handover.
        const roll = pass++ === 0 ? 'mt-roll' : 'bg-roll';
        return h('view', null, [h('text', null, roll)]);
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    expect(doc.querySelector('text')?.textContent).toBe('mt-roll');
    const paintedView = doc.querySelector('view')!;

    bgHydrate(Comp);

    env().switchToMainThread();
    expect(doc.querySelector('view')).toBe(paintedView);
    expect(doc.querySelector('text')?.textContent).toBe('bg-roll');
  });

  it('is correct when the background renders a longer list', () => {
    let pass = 0;
    const Comp = defineComponent({
      render() {
        const n = pass++ === 0 ? 2 : 4;
        return h(
          'view',
          null,
          Array.from({ length: n }, (_, i) => h('text', null, `row-${i}`)),
        );
      },
    });

    const doc = mtFirstScreenRender(Comp);
    bgHydrate(Comp);

    env().switchToMainThread();
    const texts = doc.querySelectorAll('text');
    expect(texts.length).toBe(4);
    expect([...texts].map((t) => t.textContent)).toEqual([
      'row-0',
      'row-1',
      'row-2',
      'row-3',
    ]);
  });
});

describe('IFR tree handover + element templates', () => {
  it('adopts INSTANTIATE_TEMPLATE instances without re-instantiating', async () => {
    const tpl = registerElementTemplate(
      'ifr-tree-tpl',
      ['#text', 'onTap'],
      (P: number) => {
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
      },
    );
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
    const paintedCard = doc.querySelector('.card')!;
    expect(doc.querySelector('.label')?.textContent).toBe('n:0');

    bgHydrate(Comp);

    env().switchToMainThread();
    expect(doc.querySelectorAll('.card').length).toBe(1);
    expect(doc.querySelector('.card')).toBe(paintedCard);

    fireEvent.tap(doc.querySelector('.btn')!);
    await waitForUpdate();
    env().switchToMainThread();
    expect(doc.querySelector('.label')?.textContent).toBe('n:1');
  });
});
