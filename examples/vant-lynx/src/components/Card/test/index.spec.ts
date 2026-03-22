import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Card from '../index.vue';

describe('Card', () => {
  it('should emit clickThumb event after clicking thumb', async () => {
    const onClickThumb = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, {
            thumb: 'https://example.com/img.jpg',
            onClickThumb: onClickThumb,
          });
        },
      }),
    );

    const thumbViews = container.querySelectorAll('view');
    // Find the thumb element (has van-card__thumb class)
    const thumb = Array.from(thumbViews).find((v) =>
      v.getAttribute('class')?.includes('van-card__thumb'),
    );
    if (thumb) {
      fireEvent.tap(thumb);
      await nextTick();
    }
    expect(onClickThumb).toHaveBeenCalledTimes(1);
  });

  it('should render price and num slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              num: () => h('text', null, 'Custom Num'),
              price: () => h('text', null, 'Custom Price'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasNum = Array.from(textEls).some((t) => t.textContent === 'Custom Num');
    const hasPrice = Array.from(textEls).some((t) => t.textContent === 'Custom Price');
    expect(hasNum).toBe(true);
    expect(hasPrice).toBe(true);
  });

  it('should render origin-price slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              'origin-price': () => h('text', null, 'Custom Origin Price'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasOrigin = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Origin Price',
    );
    expect(hasOrigin).toBe(true);
  });

  it('should render bottom slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              bottom: () => h('text', null, 'Custom Bottom'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasBottom = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Bottom',
    );
    expect(hasBottom).toBe(true);
  });

  it('should render thumb and tag slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              tag: () => h('text', null, 'Custom Tag'),
              thumb: () => h('text', null, 'Custom Thumb'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasTag = Array.from(textEls).some((t) => t.textContent === 'Custom Tag');
    const hasThumb = Array.from(textEls).some((t) => t.textContent === 'Custom Thumb');
    expect(hasTag).toBe(true);
    expect(hasThumb).toBe(true);
  });

  it('should render title and desc slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              title: () => h('text', null, 'Custom Title'),
              desc: () => h('text', null, 'Custom Desc'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Custom Title');
    const hasDesc = Array.from(textEls).some((t) => t.textContent === 'Custom Desc');
    expect(hasTitle).toBe(true);
    expect(hasDesc).toBe(true);
  });

  it('should render price and price-top slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
            {
              price: () => h('text', null, 'Custom Price'),
              'price-top': () => h('text', null, 'Custom Price-top'),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasPrice = Array.from(textEls).some((t) => t.textContent === 'Custom Price');
    const hasPriceTop = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Price-top',
    );
    expect(hasPrice).toBe(true);
    expect(hasPriceTop).toBe(true);
  });

  it('should render correctly when the price is an integer', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: 12 });
        },
      }),
    );

    // Find the price section - currency + integer parts
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    // Should have ¥ and 12 as separate text elements
    expect(texts).toContain('¥');
    expect(texts).toContain('12');
    // Should NOT have a decimal part
    expect(texts).not.toContain('.');
  });

  it('should render correctly when the price has decimals', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '12.50' });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('¥');
    expect(texts).toContain('12');
    expect(texts).toContain('.');
    expect(texts).toContain('50');
  });

  it('should render card with title prop', () => {
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

  it('should render card with desc prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { desc: 'A great product' });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasDesc = Array.from(textEls).some((t) => t.textContent === 'A great product');
    expect(hasDesc).toBe(true);
  });

  it('should render num', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { num: 2 });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasNum = Array.from(textEls).some((t) => t.textContent === 'x2');
    expect(hasNum).toBe(true);
  });

  it('should render tag with Tag component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { tag: 'Sale', thumb: 'https://example.com/img.jpg' });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasTag = Array.from(textEls).some((t) => t.textContent === 'Sale');
    expect(hasTag).toBe(true);
  });

  it('should use custom currency', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00', currency: '$' });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('$');
  });

  it('should render footer slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Card,
            null,
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

  it('should render origin price', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00', originPrice: '20.00' });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasOrigin = Array.from(textEls).some((t) =>
      t.textContent?.includes('20.00'),
    );
    expect(hasOrigin).toBe(true);
  });
});
