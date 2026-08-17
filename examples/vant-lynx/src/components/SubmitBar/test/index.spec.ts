import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import SubmitBar from '../index.vue';

describe('SubmitBar', () => {
  it('should render root element with van-submit-bar class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const root = container.querySelector('.van-submit-bar');
    expect(root).toBeTruthy();
  });

  it('should render bar with van-submit-bar__bar class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const bar = container.querySelector('.van-submit-bar__bar');
    expect(bar).toBeTruthy();
  });

  it('should render price correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const integer = container.querySelector('.van-submit-bar__price-integer');
    const decimal = container.querySelector('.van-submit-bar__decimal');
    expect(integer).toBeTruthy();
    expect(integer!.textContent).toBe('30');
    expect(decimal!.textContent).toBe('.50');
  });

  it('should render price with custom decimal length', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, decimalLength: 0 });
        },
      }),
    );
    const integer = container.querySelector('.van-submit-bar__price-integer');
    const decimal = container.querySelector('.van-submit-bar__decimal');
    expect(integer!.textContent).toBe('31');
    expect(decimal).toBeNull();
  });

  it('should render default label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const label = container.querySelector('.van-submit-bar__label');
    expect(label).toBeTruthy();
    expect(label!.textContent).toBe('合计：');
  });

  it('should render custom label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, label: 'Total:' });
        },
      }),
    );
    const label = container.querySelector('.van-submit-bar__label');
    expect(label!.textContent).toBe('Total:');
  });

  it('should not render label without price', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar);
        },
      }),
    );
    const text = container.querySelector('.van-submit-bar__text');
    expect(text).toBeNull();
  });

  it('should render suffix label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, suffixLabel: '(税后)' });
        },
      }),
    );
    const suffix = container.querySelector('.van-submit-bar__suffix-label');
    expect(suffix).toBeTruthy();
    expect(suffix!.textContent).toBe('(税后)');
  });

  it('should render currency symbol', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, currency: '$' });
        },
      }),
    );
    const currency = container.querySelector('.van-submit-bar__currency');
    expect(currency!.textContent).toBe('$');
  });

  it('should emit submit event on button click', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, {
            price: 3050,
            buttonText: 'Submit',
            onSubmit,
          });
        },
      }),
    );
    const button = container.querySelector('.van-submit-bar__button');
    expect(button).toBeTruthy();
    fireEvent.tap(button!);
    await nextTick();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should render tip', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, tip: '提示文案' });
        },
      }),
    );
    const tip = container.querySelector('.van-submit-bar__tip');
    expect(tip).toBeTruthy();
    const tipText = container.querySelector('.van-submit-bar__tip-text');
    expect(tipText!.textContent).toBe('提示文案');
  });

  it('should render tip with icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, tip: '提示文案', tipIcon: 'info-o' });
        },
      }),
    );
    const tipIcon = container.querySelector('.van-submit-bar__tip-icon');
    expect(tipIcon).toBeTruthy();
  });

  it('should render top slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 }, {
            top: () => h('text', null, 'Top Content'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTop = Array.from(textEls).some((t) => t.textContent === 'Top Content');
    expect(hasTop).toBe(true);
  });

  it('should render button slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 }, {
            button: () => h('text', null, 'Custom Button'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomButton = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Button',
    );
    expect(hasCustomButton).toBe(true);
  });

  it('should render default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 }, {
            default: () => h('text', null, 'Default Content'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDefault = Array.from(textEls).some(
      (t) => t.textContent === 'Default Content',
    );
    expect(hasDefault).toBe(true);
  });

  it('should render tip slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 }, {
            tip: () => h('text', null, 'Custom Tip'),
          });
        },
      }),
    );
    const tip = container.querySelector('.van-submit-bar__tip');
    expect(tip).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasTip = Array.from(textEls).some((t) => t.textContent === 'Custom Tip');
    expect(hasTip).toBe(true);
  });

  it('should apply safe-area-inset-bottom class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const root = container.querySelector('.van-safe-area-bottom');
    expect(root).toBeTruthy();
  });

  it('should not apply safe-area-inset-bottom class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, safeAreaInsetBottom: false });
        },
      }),
    );
    const root = container.querySelector('.van-safe-area-bottom');
    expect(root).toBeNull();
  });

  it('should render text-align left', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050, textAlign: 'left' });
        },
      }),
    );
    const text = container.querySelector('.van-submit-bar__text--left');
    expect(text).toBeTruthy();
  });
});
