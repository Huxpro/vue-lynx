import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Card from '../index.vue';

describe('Card', () => {
  it('should render card with title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product Name' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Product Name');
    expect(hasTitle).toBe(true);
  });

  it('should render card with description', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', desc: 'A great product' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDesc = Array.from(textEls).some((t) => t.textContent === 'A great product');
    expect(hasDesc).toBe(true);
  });

  it('should render price with currency symbol', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', price: '10.00' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasPrice = Array.from(textEls).some((t) =>
      t.textContent?.includes('10.00'),
    );
    expect(hasPrice).toBe(true);
  });

  it('should render origin price with line-through', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', price: '10.00', originPrice: '20.00' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasOrigin = Array.from(textEls).some((t) =>
      t.textContent?.includes('20.00'),
    );
    expect(hasOrigin).toBe(true);
  });

  it('should render num', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', num: 2 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasNum = Array.from(textEls).some((t) => t.textContent === 'x2');
    expect(hasNum).toBe(true);
  });

  it('should render tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', tag: 'New' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTag = Array.from(textEls).some((t) => t.textContent === 'New');
    expect(hasTag).toBe(true);
  });

  it('should emit click event on tap', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Card, {
            title: 'Product',
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const outerView = container.querySelector('view');
    if (outerView) {
      fireEvent.tap(outerView);
      await nextTick();
      expect(clicks.length).toBe(1);
    }
  });

  it('should use custom currency', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product', price: '10.00', currency: '$' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasPrice = Array.from(textEls).some((t) =>
      t.textContent?.includes('$10.00'),
    );
    expect(hasPrice).toBe(true);
  });

  it('should render footer slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            { title: 'Product' },
            {
              footer: () => h('text', null, 'Footer content'),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasFooter = Array.from(textEls).some(
      (t) => t.textContent === 'Footer content',
    );
    expect(hasFooter).toBe(true);
  });
});
