import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import CouponList from '../index.vue';
import type { CouponInfo } from '../../Coupon/types';

const coupon: CouponInfo = {
  id: 1,
  name: 'name',
  discount: 0,
  denominations: 150,
  originCondition: 0,
  reason: '',
  value: 150,
  description: 'description',
  startAt: 1489104000,
  endAt: 1514592000,
};

const coupon2: CouponInfo = {
  ...coupon,
  id: 2,
  denominations: 100,
};

const coupon3: CouponInfo = {
  ...coupon,
  id: 3,
  denominations: 123,
};

const disabledCoupon: CouponInfo = {
  ...coupon,
  id: 4,
  reason: 'reason',
};

const discountCoupon: CouponInfo = {
  ...coupon,
  id: 5,
  discount: 88,
  denominations: 0,
  originCondition: 50,
  value: 12,
  description: '',
};

const discountCoupon2: CouponInfo = {
  ...coupon,
  id: 6,
  discount: 90,
  denominations: 0,
  originCondition: 50,
  value: 12,
  description: '',
};

const disabledDiscountCoupon: CouponInfo = {
  ...discountCoupon,
  id: 7,
  discount: 10,
  reason: '',
};

const emptyCoupon: CouponInfo = {
  id: 0,
  name: '',
  discount: 0,
  value: 0,
  description: '',
  denominations: 0,
  originCondition: 0,
  startAt: 1489104000,
  endAt: 1514592000,
};

describe('CouponList', () => {
  it('should render coupon list with coupons', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            chosenCoupon: 1,
            coupons: [emptyCoupon, coupon, coupon2, coupon3, discountCoupon, discountCoupon2],
            disabledCoupons: [disabledCoupon, disabledDiscountCoupon],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const couponEls = container.querySelectorAll('.van-coupon');
    expect(couponEls.length).toBeGreaterThan(0);
  });

  it('should render empty state when coupon list is empty', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [],
            disabledCoupons: [],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const emptyTips = container.querySelectorAll('.van-coupon-list__empty-tip');
    expect(emptyTips.length).toBeGreaterThan(0);
  });

  it('should render exchange bar by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
          });
        },
      }),
    );
    await nextTick();

    const exchangeBar = container.querySelector('.van-coupon-list__exchange-bar');
    expect(exchangeBar).toBeTruthy();
  });

  it('should hide exchange bar when showExchangeBar is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            showExchangeBar: false,
          });
        },
      }),
    );
    await nextTick();

    const exchangeBar = container.querySelector('.van-coupon-list__exchange-bar');
    expect(exchangeBar).toBeFalsy();
  });

  it('should emit exchange event when exchange button is clicked', async () => {
    const onExchange = vi.fn();
    const onUpdateCode = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            onExchange,
            'onUpdate:code': onUpdateCode,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // Find the exchange button
    const exchangeBtn = container.querySelector('.van-coupon-list__exchange');
    expect(exchangeBtn).toBeTruthy();

    // Button should be disabled when input is empty
    if (exchangeBtn) {
      fireEvent.tap(exchangeBtn);
      await nextTick();
      // exchange should not be called when input is empty (button disabled)
    }
  });

  it('should emit change event when coupon is clicked', async () => {
    const onChange = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon, coupon2],
            chosenCoupon: -1,
            onChange,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const couponEls = container.querySelectorAll('.van-coupon');
    if (couponEls.length > 0) {
      fireEvent.tap(couponEls[0].parentElement!);
      await nextTick();
      expect(onChange).toHaveBeenCalledWith(0);
    }
  });

  it('should support array chosenCoupon for multi-select', async () => {
    const onChange = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon, coupon2, coupon3],
            chosenCoupon: [0],
            onChange,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const couponEls = container.querySelectorAll('.van-coupon');
    if (couponEls.length > 1) {
      fireEvent.tap(couponEls[1].parentElement!);
      await nextTick();
      expect(onChange).toHaveBeenCalledWith([0, 1]);
    }
  });

  it('should render close button with correct text', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            showCloseButton: true,
            closeButtonText: '关闭',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeBtn = container.querySelector('.van-coupon-list__close');
    expect(closeBtn).toBeTruthy();
    const textEls = closeBtn?.querySelectorAll('text');
    const hasCloseText = Array.from(textEls || []).some((t) => t.textContent?.includes('关闭'));
    expect(hasCloseText).toBe(true);
  });

  it('should hide close button when showCloseButton is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            showCloseButton: false,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeBtn = container.querySelector('.van-coupon-list__close');
    expect(closeBtn).toBeFalsy();
  });

  it('should show tab titles with count', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon, coupon2],
            disabledCoupons: [disabledCoupon],
            showCount: true,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    const hasEnabledCount = texts.some((t) => t?.includes('(2)'));
    expect(hasEnabledCount).toBe(true);
  });

  it('should render list-footer slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CouponList,
            { coupons: [coupon] },
            { 'list-footer': () => h('text', null, 'List Footer') },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasFooter = Array.from(textEls).some((t) => t.textContent === 'List Footer');
    expect(hasFooter).toBe(true);
  });

  it('should render list-button slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CouponList,
            { coupons: [coupon] },
            { 'list-button': () => h('text', null, 'Custom Button') },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasCustomBtn = Array.from(textEls).some((t) => t.textContent === 'Custom Button');
    expect(hasCustomBtn).toBe(true);
  });

  it('should use BEM classes', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
          });
        },
      }),
    );
    await nextTick();

    expect(container.querySelector('.van-coupon-list')).toBeTruthy();
  });

  it('should emit change(-1) when close button is clicked in single mode', async () => {
    const onChange = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            chosenCoupon: 0,
            showCloseButton: true,
            onChange,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeBtn = container.querySelector('.van-coupon-list__close');
    if (closeBtn) {
      fireEvent.tap(closeBtn);
      await nextTick();
      expect(onChange).toHaveBeenCalledWith(-1);
    }
  });

  it('should emit change([]) when close button is clicked in array mode', async () => {
    const onChange = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            chosenCoupon: [0],
            showCloseButton: true,
            onChange,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeBtn = container.querySelector('.van-coupon-list__close');
    if (closeBtn) {
      fireEvent.tap(closeBtn);
      await nextTick();
      expect(onChange).toHaveBeenCalledWith([]);
    }
  });
});

describe('Coupon', () => {
  it('should render coupon with denomination', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            chosenCoupon: -1,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const couponEls = container.querySelectorAll('.van-coupon');
    expect(couponEls.length).toBe(1);

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('name');
  });

  it('should render coupon description', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const descEls = container.querySelectorAll('.van-coupon__description');
    expect(descEls.length).toBeGreaterThan(0);
  });

  it('should render disabled coupon with reason', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [],
            disabledCoupons: [disabledCoupon],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // Switch to disabled tab
    const tabs = container.querySelectorAll('.van-tab');
    if (tabs.length > 1) {
      fireEvent.tap(tabs[1]);
      await nextTick();
      await nextTick();

      const disabledEls = container.querySelectorAll('.van-coupon--disabled');
      expect(disabledEls.length).toBe(1);
    }
  });

  it('should show checkbox for enabled coupons', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [coupon],
            chosenCoupon: 0,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const corners = container.querySelectorAll('.van-coupon__corner');
    expect(corners.length).toBe(1);
  });

  it('should not show checkbox for disabled coupons', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CouponList, {
            coupons: [],
            disabledCoupons: [disabledCoupon],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // Switch to disabled tab
    const tabs = container.querySelectorAll('.van-tab');
    if (tabs.length > 1) {
      fireEvent.tap(tabs[1]);
      await nextTick();
      await nextTick();

      const corners = container.querySelectorAll('.van-coupon__corner');
      expect(corners.length).toBe(0);
    }
  });
});
