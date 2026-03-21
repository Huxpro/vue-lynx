import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import CouponList from '../index.vue';

describe('CouponList', () => {
  const coupons = [
    {
      id: '1',
      name: 'Coupon 1',
      condition: 'No minimum',
      value: 500,
      startAt: 1672531200,
      endAt: 1704067200,
    },
    {
      id: '2',
      name: 'Coupon 2',
      condition: 'Min $50',
      value: 1000,
    },
  ];

  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render coupon items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Coupon 1');
    expect(textContents).toContain('Coupon 2');
  });

  it('should show exchange bar by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Exchange');
  });

  it('should hide exchange bar when showExchangeBar is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons, showExchangeBar: false });
        },
      }),
    );
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBe(0);
  });

  it('should show close button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons, chosenCoupon: 0 });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Use Coupon');
  });

  it('should show tab titles with count', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons, showCount: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Available (2)');
  });
});
