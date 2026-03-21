import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import CouponList from '../index.vue';

describe('CouponList', () => {
  const coupons = [
    {
      name: 'Coupon 1',
      condition: 'No threshold',
      value: 150,
      startAt: Date.now() / 1000,
      endAt: Date.now() / 1000 + 86400,
    },
    {
      name: 'Coupon 2',
      condition: 'Orders over \u00a5100',
      value: 50,
      startAt: Date.now() / 1000,
      endAt: Date.now() / 1000 + 86400,
    },
  ];

  it('should render coupon list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCoupon1 = Array.from(textEls).some((t) => t.textContent === 'Coupon 1');
    const hasCoupon2 = Array.from(textEls).some((t) => t.textContent === 'Coupon 2');
    expect(hasCoupon1).toBe(true);
    expect(hasCoupon2).toBe(true);
  });

  it('should render exchange bar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasExchange = Array.from(textEls).some((t) => t.textContent === 'Exchange');
    expect(hasExchange).toBe(true);
  });

  it('should render with disabled coupons', () => {
    const disabledCoupons = [
      {
        name: 'Expired Coupon',
        condition: 'Expired',
        value: 100,
        startAt: Date.now() / 1000 - 172800,
        endAt: Date.now() / 1000 - 86400,
      },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons: [], disabledCoupons });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render tabs', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons,
            enabledTitle: 'Available',
            disabledTitle: 'Unavailable',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasEnabled = Array.from(textEls).some((t) =>
      t.textContent?.includes('Available'),
    );
    expect(hasEnabled).toBe(true);
  });

  it('should hide exchange bar when showExchangeBar is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, { coupons, showExchangeBar: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasExchange = Array.from(textEls).some((t) => t.textContent === 'Exchange');
    expect(hasExchange).toBe(false);
  });
});
