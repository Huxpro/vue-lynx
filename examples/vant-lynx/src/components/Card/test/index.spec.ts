import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Card from '../index.vue';

describe('Card', () => {
  // BEM class structure tests
  it('should render root element with van-card class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '2.00', title: 'Test' });
        },
      }),
    );

    const root = container.querySelector('.van-card');
    expect(root).toBeTruthy();
  });

  it('should render header with van-card__header class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' });
        },
      }),
    );

    const header = container.querySelector('.van-card__header');
    expect(header).toBeTruthy();
  });

  it('should render thumb with van-card__thumb class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { thumb: 'https://example.com/img.jpg' });
        },
      }),
    );

    const thumb = container.querySelector('.van-card__thumb');
    expect(thumb).toBeTruthy();
  });

  it('should render content with van-card__content class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' });
        },
      }),
    );

    const content = container.querySelector('.van-card__content');
    expect(content).toBeTruthy();
  });

  it('should render centered content with --centered modifier', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test', centered: true });
        },
      }),
    );

    const content = container.querySelector('.van-card__content--centered');
    expect(content).toBeTruthy();
  });

  it('should render title with van-card__title class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Product Name' });
        },
      }),
    );

    const title = container.querySelector('.van-card__title');
    expect(title).toBeTruthy();
    const textEls = title!.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Product Name');
    expect(hasTitle).toBe(true);
  });

  it('should render desc with van-card__desc class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { desc: 'A great product' });
        },
      }),
    );

    const desc = container.querySelector('.van-card__desc');
    expect(desc).toBeTruthy();
    const textEls = desc!.querySelectorAll('text');
    const hasDesc = Array.from(textEls).some((t) => t.textContent === 'A great product');
    expect(hasDesc).toBe(true);
  });

  it('should render price with van-card__price class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00' });
        },
      }),
    );

    const price = container.querySelector('.van-card__price');
    expect(price).toBeTruthy();
  });

  it('should render price-currency, price-integer, price-decimal', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '12.50' });
        },
      }),
    );

    const currency = container.querySelector('.van-card__price-currency');
    const integer = container.querySelector('.van-card__price-integer');
    const decimal = container.querySelector('.van-card__price-decimal');
    expect(currency).toBeTruthy();
    expect(integer).toBeTruthy();
    expect(decimal).toBeTruthy();
    expect(currency!.textContent).toBe('¥');
    expect(integer!.textContent).toBe('12');
    expect(decimal!.textContent).toBe('50');
  });

  it('should render correctly when the price is an integer', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: 12 });
        },
      }),
    );

    const currency = container.querySelector('.van-card__price-currency');
    const integer = container.querySelector('.van-card__price-integer');
    const decimal = container.querySelector('.van-card__price-decimal');
    expect(currency!.textContent).toBe('¥');
    expect(integer!.textContent).toBe('12');
    expect(decimal).toBeNull();
  });

  it('should render origin-price with van-card__origin-price class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00', originPrice: '20.00' });
        },
      }),
    );

    const originPrice = container.querySelector('.van-card__origin-price');
    expect(originPrice).toBeTruthy();
    const textEls = originPrice!.querySelectorAll('text');
    const hasOrigin = Array.from(textEls).some((t) => t.textContent?.includes('20.00'));
    expect(hasOrigin).toBe(true);
  });

  it('should render num with van-card__num class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { num: 2 });
        },
      }),
    );

    const num = container.querySelector('.van-card__num');
    expect(num).toBeTruthy();
    const textEls = num!.querySelectorAll('text');
    const hasNum = Array.from(textEls).some((t) => t.textContent === 'x2');
    expect(hasNum).toBe(true);
  });

  it('should render bottom with van-card__bottom class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00' });
        },
      }),
    );

    const bottom = container.querySelector('.van-card__bottom');
    expect(bottom).toBeTruthy();
  });

  it('should render footer with van-card__footer class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, null, {
            footer: () => h('text', null, 'Footer content'),
          });
        },
      }),
    );

    const footer = container.querySelector('.van-card__footer');
    expect(footer).toBeTruthy();
  });

  it('should render tag with van-card__tag class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { tag: 'Sale', thumb: 'https://example.com/img.jpg' });
        },
      }),
    );

    const tag = container.querySelector('.van-card__tag');
    expect(tag).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasTag = Array.from(textEls).some((t) => t.textContent === 'Sale');
    expect(hasTag).toBe(true);
  });

  // Event tests (matching Vant)
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

    const thumb = container.querySelector('.van-card__thumb');
    expect(thumb).toBeTruthy();
    fireEvent.tap(thumb!);
    await nextTick();
    expect(onClickThumb).toHaveBeenCalledTimes(1);
  });

  // Slot tests (matching Vant)
  it('should render price and num slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, null, {
            num: () => h('text', null, 'Custom Num'),
            price: () => h('text', null, 'Custom Price'),
          });
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
          return h(Card, null, {
            'origin-price': () => h('text', null, 'Custom Origin Price'),
          });
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
          return h(Card, null, {
            bottom: () => h('text', null, 'Custom Bottom'),
          });
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
          return h(Card, null, {
            tag: () => h('text', null, 'Custom Tag'),
            thumb: () => h('text', null, 'Custom Thumb'),
          });
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
          return h(Card, null, {
            title: () => h('text', null, 'Custom Title'),
            desc: () => h('text', null, 'Custom Desc'),
          });
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
          return h(Card, null, {
            price: () => h('text', null, 'Custom Price'),
            'price-top': () => h('text', null, 'Custom Price-top'),
          });
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

  // Additional prop tests
  it('should use custom currency', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { price: '10.00', currency: '$' });
        },
      }),
    );

    const currency = container.querySelector('.van-card__price-currency');
    expect(currency!.textContent).toBe('$');
  });

  it('should not render thumb when no thumb prop or slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' });
        },
      }),
    );

    const thumb = container.querySelector('.van-card__thumb');
    expect(thumb).toBeNull();
  });

  it('should not render footer when no footer slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' });
        },
      }),
    );

    const footer = container.querySelector('.van-card__footer');
    expect(footer).toBeNull();
  });

  it('should not render bottom when no price/num/originPrice', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' });
        },
      }),
    );

    const bottom = container.querySelector('.van-card__bottom');
    expect(bottom).toBeNull();
  });

  it('should render tags slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Card, { title: 'Test' }, {
            tags: () => h('text', null, 'Tag Content'),
          });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasTags = Array.from(textEls).some((t) => t.textContent === 'Tag Content');
    expect(hasTags).toBe(true);
  });
});
