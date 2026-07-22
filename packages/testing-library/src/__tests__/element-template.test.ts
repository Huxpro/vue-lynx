/**
 * Element-template protocol tests (route b runtime layer).
 *
 * Registers hand-written templates (what the compiler transform generates)
 * and drives them through the full dual-thread pipeline: lowered vnode →
 * INSTANTIATE_TEMPLATE op → MT create() → hole updates via ordinary SET ops.
 */

import { describe, it, expect } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  registerElementTemplate,
} from 'vue-lynx';
import { render } from '../index.js';
import { fireEvent } from '../fire-event.js';

/**
 * Template equivalent of:
 *   <view class="card">            ← root (props stay on the vnode)
 *     <image class="icon" src="a.png" />
 *     <text class="title">{HOLE #text}</text>
 *     <view {HOLE class}><text>static tail</text></view>
 *   </view>
 * holes: [ '#text' (title), 'class' (badge view) ]
 */
function registerCardTemplate(id: string): string {
  return registerElementTemplate(id, ['#text', 'class'], (P: number) => {
    const e0 = __CreateView(P);
    __SetCSSId([e0], 0);
    const e1 = __CreateImage(P);
    __SetCSSId([e1], 0);
    __SetClasses(e1, 'icon');
    __SetAttribute(e1, 'src', 'a.png');
    __AppendElement(e0, e1);
    const e2 = __CreateText(P);
    __SetCSSId([e2], 0);
    __SetClasses(e2, 'title');
    __AppendElement(e0, e2);
    const e3 = __CreateView(P);
    __SetCSSId([e3], 0);
    const e4 = __CreateText(P);
    __SetCSSId([e4], 0);
    __SetAttribute(e4, 'text', 'static tail');
    __AppendElement(e3, e4);
    __AppendElement(e0, e3);
    return [e0, e2, e3];
  });
}

describe('element templates (route b protocol)', () => {
  it('instantiates the skeleton and applies hole values on mount', () => {
    const tpl = registerCardTemplate('t-mount');
    const Comp = defineComponent({
      render() {
        return h(`__vlx-tpl:${tpl}`, {
          class: 'card',
          __h0: 'Hello Holes',
          __h1: 'badge badge-on',
        });
      },
    });

    const { container } = render(Comp);
    const card = container.querySelector('.card')!;
    expect(card).not.toBeNull();
    expect(card.querySelector('image')?.getAttribute('src')).toBe('a.png');
    expect(card.querySelector('.title')?.textContent).toBe('Hello Holes');
    expect(card.querySelector('.badge.badge-on')).not.toBeNull();
    expect(card.querySelector('.badge')?.textContent).toBe('static tail');
  });

  it('patches holes and root props on update through ordinary SET ops', async () => {
    const tpl = registerCardTemplate('t-update');
    const title = ref('one');
    const badgeCls = ref('badge a');
    const rootCls = ref('card v1');
    const Comp = defineComponent({
      render() {
        return h(`__vlx-tpl:${tpl}`, {
          class: rootCls.value,
          __h0: title.value,
          __h1: badgeCls.value,
        });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('.title')?.textContent).toBe('one');

    title.value = 'two';
    badgeCls.value = 'badge b';
    rootCls.value = 'card v2';
    await nextTick();

    expect(container.querySelector('.title')?.textContent).toBe('two');
    expect(container.querySelector('.badge.b')).not.toBeNull();
    expect(container.querySelector('.badge.a')).toBeNull();
    expect(container.querySelector('.v2')).not.toBeNull();
  });

  it('routes event holes to background handlers', async () => {
    const tpl = registerElementTemplate('t-event', ['onTap', '#text'], (P: number) => {
      const e0 = __CreateView(P);
      __SetCSSId([e0], 0);
      const e1 = __CreateView(P);
      __SetCSSId([e1], 0);
      __SetClasses(e1, 'btn');
      __AppendElement(e0, e1);
      const e2 = __CreateText(P);
      __SetCSSId([e2], 0);
      __SetClasses(e2, 'count');
      __AppendElement(e0, e2);
      return [e0, e1, e2];
    });
    const count = ref(0);
    const Comp = defineComponent({
      render() {
        return h(`__vlx-tpl:${tpl}`, {
          __h0: () => count.value++,
          __h1: `n:${count.value}`,
        });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('.count')?.textContent).toBe('n:0');

    fireEvent.tap(container.querySelector('.btn')!);
    await nextTick();
    expect(container.querySelector('.count')?.textContent).toBe('n:1');
  });

  it('works inside v-for lists (one instantiation per item, correct anchors)', async () => {
    const tpl = registerElementTemplate('t-item', ['#text'], (P: number) => {
      const e0 = __CreateView(P);
      __SetCSSId([e0], 0);
      __SetClasses(e0, 'item');
      const e1 = __CreateText(P);
      __SetCSSId([e1], 0);
      __AppendElement(e0, e1);
      return [e0, e1];
    });
    const items = ref(['a', 'b', 'c']);
    const Comp = defineComponent({
      render() {
        return h(
          'view',
          { class: 'wrap' },
          items.value.map((label) =>
            h(`__vlx-tpl:${tpl}`, { key: label, __h0: label })
          ),
        );
      },
    });

    const { container } = render(Comp);
    let texts = [...container.querySelectorAll('.item')].map((n) => n.textContent);
    expect(texts).toEqual(['a', 'b', 'c']);

    // Reorder + insert + remove: template roots must move like ordinary
    // elements (INSERT/REMOVE ops on the root id).
    items.value = ['c', 'x', 'a'];
    await nextTick();
    texts = [...container.querySelectorAll('.item')].map((n) => n.textContent);
    expect(texts).toEqual(['c', 'x', 'a']);
  });

  it('degrades to an empty view when the template is not registered', () => {
    const Comp = defineComponent({
      render() {
        return h('view', { class: 'root' }, [
          h('__vlx-tpl:never-registered', { __h0: 'x' }),
          h('text', null, 'after'),
        ]);
      },
    });

    const { container } = render(Comp);
    // Tree survives; the sibling still renders.
    expect(container.querySelector('.root')).not.toBeNull();
    expect(container.querySelectorAll('text').length).toBeGreaterThanOrEqual(1);
  });

  it('unmounts a template instance with a single REMOVE', async () => {
    const tpl = registerCardTemplate('t-unmount');
    const show = ref(true);
    const Comp = defineComponent({
      render() {
        return h('view', { class: 'wrap' }, [
          show.value
            ? h(`__vlx-tpl:${tpl}`, { class: 'card', __h0: 't', __h1: 'b' })
            : h('text', null, 'gone'),
        ]);
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('.card')).not.toBeNull();

    show.value = false;
    await nextTick();
    expect(container.querySelector('.card')).toBeNull();
    expect(container.textContent).toContain('gone');
  });

  it('mounts element-slot content into a wrapper via slot-index ops', async () => {
    // Skeleton: card > image, slot-wrapper, title-text
    // holes: ['#slot', '#text']
    const tpl = registerElementTemplate(
      't-slot',
      ['#slot', '#text'],
      (P: number) => {
        const e0 = __CreateView(P);
        __SetCSSId([e0], 0);
        const e1 = __CreateImage(P);
        __SetCSSId([e1], 0);
        __SetClasses(e1, 'icon');
        __SetAttribute(e1, 'src', 'a.png');
        __AppendElement(e0, e1);
        const e2 = __CreateWrapperElement(P);
        __AppendElement(e0, e2);
        const e3 = __CreateText(P);
        __SetCSSId([e3], 0);
        __SetClasses(e3, 'title');
        __AppendElement(e0, e3);
        return [e0, e2, e3];
      },
    );

    const show = ref(true);
    const title = ref('Hello');
    const Comp = defineComponent({
      render() {
        return h(`__vlx-tpl:${tpl}`, {
          class: 'card',
          __h0: show.value
            ? h('view', { class: 'cond' }, [h('text', null, 'visible')])
            : null,
          __h1: title.value,
        });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('.icon')).not.toBeNull();
    expect(container.querySelector('.cond')?.textContent).toBe('visible');
    expect(container.querySelector('.title')?.textContent).toBe('Hello');
    // Slot content lives under the wrapper placeholder.
    expect(container.querySelector('wrapper .cond')).not.toBeNull();

    show.value = false;
    title.value = 'Bye';
    await nextTick();
    expect(container.querySelector('.cond')).toBeNull();
    expect(container.querySelector('.title')?.textContent).toBe('Bye');

    show.value = true;
    await nextTick();
    expect(container.querySelector('.cond')?.textContent).toBe('visible');
  });

  it('mounts multiple children into an element slot (v-for-like fragment)', async () => {
    const tpl = registerElementTemplate('t-list-slot', ['#slot'], (P: number) => {
      const e0 = __CreateView(P);
      __SetCSSId([e0], 0);
      __SetClasses(e0, 'list');
      const e1 = __CreateWrapperElement(P);
      __AppendElement(e0, e1);
      return [e0, e1];
    });

    const items = ref(['a', 'b']);
    const Comp = defineComponent({
      render() {
        return h(`__vlx-tpl:${tpl}`, {
          __h0: items.value.map((label) =>
            h('view', { class: 'row', key: label }, [
              h('text', { class: 'label' }, label),
            ])
          ),
        });
      },
    });

    const { container } = render(Comp);
    let labels = [...container.querySelectorAll('.label')].map((n) =>
      n.textContent
    );
    expect(labels).toEqual(['a', 'b']);

    items.value = ['b', 'c', 'a'];
    await nextTick();
    labels = [...container.querySelectorAll('.label')].map((n) => n.textContent);
    expect(labels).toEqual(['b', 'c', 'a']);
  });
});
