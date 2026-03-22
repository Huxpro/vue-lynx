import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Stepper from '../index.vue';

const LONG_PRESS_START_TIME = 600;

// Helper: fire Lynx input event
function fireInputEvent(el: Element, value: string) {
  const event = new Event('bindEvent:input', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'input',
    detail: { value },
  });
  fireEvent(el, event);
}

// Helper: fire Lynx blur event
function fireBlurEvent(el: Element, value?: string) {
  const event = new Event('bindEvent:blur', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'blur',
    detail: { value: value ?? '' },
  });
  fireEvent(el, event);
}

// Helper: fire Lynx focus event
function fireFocusEvent(el: Element) {
  const event = new Event('bindEvent:focus', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'focus',
    detail: {},
  });
  fireEvent(el, event);
}

describe('Stepper', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1 });
        },
      }),
    );
    expect(container.querySelector('.van-stepper')).toBeTruthy();
    expect(container.querySelector('.van-stepper__minus')).toBeTruthy();
    expect(container.querySelector('.van-stepper__plus')).toBeTruthy();
    expect(container.querySelector('.van-stepper__input')).toBeTruthy();
  });

  it('should apply disabled class to buttons and input when using disabled prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, disabled: true });
        },
      }),
    );
    expect(
      container.querySelector('.van-stepper__minus--disabled'),
    ).toBeTruthy();
    expect(
      container.querySelector('.van-stepper__plus--disabled'),
    ).toBeTruthy();
    expect(
      container.querySelector('.van-stepper__input--disabled'),
    ).toBeTruthy();
  });

  it('should make input readonly when using disable-input prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, disableInput: true });
        },
      }),
    );
    const input = container.querySelector('.van-stepper__input');
    expect(input?.getAttribute('readonly')).not.toBeNull();
  });

  it('should emit minus event when clicking the minus button', async () => {
    const updates: unknown[] = [];
    const changes: unknown[] = [];
    const minusEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 2,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
            onChange: (val: unknown, detail: unknown) =>
              changes.push([val, detail]),
            onMinus: () => minusEvents.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const minus = container.querySelector('.van-stepper__minus')!;
    fireEvent.tap(minus);
    await nextTick();
    await nextTick();

    expect(minusEvents.length).toBe(1);
    expect(updates).toContainEqual(1);
    expect(changes[0]).toEqual([1, { name: '' }]);
  });

  it('should emit plus event when clicking the plus button', async () => {
    const updates: unknown[] = [];
    const changes: unknown[] = [];
    const plusEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 2,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
            onChange: (val: unknown, detail: unknown) =>
              changes.push([val, detail]),
            onPlus: () => plusEvents.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();

    expect(plusEvents.length).toBe(1);
    expect(updates).toContainEqual(3);
    expect(changes[0]).toEqual([3, { name: '' }]);
  });

  it('should emit overlimit event when clicking disabled buttons', async () => {
    const overlimitEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            max: 1,
            onOverlimit: (type: unknown) => overlimitEvents.push(type),
          });
      },
    });

    const { container } = render(Comp);
    const minus = container.querySelector('.van-stepper__minus')!;
    const plus = container.querySelector('.van-stepper__plus')!;

    fireEvent.tap(minus);
    await nextTick();
    expect(overlimitEvents).toContainEqual('minus');

    fireEvent.tap(plus);
    await nextTick();
    expect(overlimitEvents).toContainEqual('plus');
  });

  it('should disable plus button when disable-plus prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, disablePlus: true });
        },
      }),
    );
    expect(
      container.querySelector('.van-stepper__plus--disabled'),
    ).toBeTruthy();
  });

  it('should disable minus button when disable-minus prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 2, disableMinus: true });
        },
      }),
    );
    expect(
      container.querySelector('.van-stepper__minus--disabled'),
    ).toBeTruthy();
  });

  it('should limit max value when using max prop', async () => {
    const updates: unknown[] = [];
    const overlimitEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const val = ref(1);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            max: 2,
            'onUpdate:modelValue': (v: unknown) => {
              val.value = v as number;
              updates.push(v);
            },
            onOverlimit: (type: unknown) => overlimitEvents.push(type),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    const minus = container.querySelector('.van-stepper__minus')!;

    fireEvent.tap(plus);
    await nextTick();
    await nextTick();

    fireEvent.tap(plus);
    await nextTick();
    await nextTick();

    fireEvent.tap(minus);
    await nextTick();
    await nextTick();

    fireEvent.tap(minus);
    await nextTick();
    await nextTick();

    expect(updates).toContainEqual(2);
    expect(updates).toContainEqual(1);
    expect(overlimitEvents).toContainEqual('plus');
    expect(overlimitEvents).toContainEqual('minus');
  });

  it('should update value after long pressing', async () => {
    vi.useFakeTimers();
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const val = ref(1);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            'onUpdate:modelValue': (v: unknown) => {
              val.value = v as number;
              updates.push(v);
            },
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;

    // Normal tap: touchstart → touchend → tap
    fireEvent.touchstart(plus);
    fireEvent.touchend(plus);
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(2);

    // Long press
    fireEvent.touchstart(plus);
    await vi.advanceTimersByTimeAsync(LONG_PRESS_START_TIME + 500);
    fireEvent.touchend(plus);
    await nextTick();
    await nextTick();
    expect(updates.length).toBeGreaterThan(2);
    vi.useRealTimers();
  });

  it('should allow to disable long press', async () => {
    vi.useFakeTimers();
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            longPress: false,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;

    fireEvent.touchstart(plus);
    await vi.advanceTimersByTimeAsync(LONG_PRESS_START_TIME + 500);
    fireEvent.touchend(plus);
    await nextTick();

    expect(updates.length).toBe(0);
    vi.useRealTimers();
  });

  it('should filter invalid value during user input', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;

    fireInputEvent(input, '2');
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(2);
  });

  it('should watch modelValue and format it', async () => {
    const updates: unknown[] = [];
    const modelValue = ref(1);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: modelValue.value,
            max: 5,
            'onUpdate:modelValue': (v: unknown) => {
              updates.push(v);
              modelValue.value = v as number;
            },
          });
      },
    });

    render(Comp);
    modelValue.value = 10;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(5);
  });

  it('should format value to integer when using integer prop', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            integer: true,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;

    fireInputEvent(input, '2.2');
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(2);
  });

  it('should emit focus event when input is focused', async () => {
    const focusEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            onFocus: (e: unknown) => focusEvents.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;
    fireFocusEvent(input);
    await nextTick();
    expect(focusEvents.length).toBe(1);
  });

  it('should not emit focus event when disableInput is true', async () => {
    const focusEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            disableInput: true,
            onFocus: (e: unknown) => focusEvents.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;
    fireFocusEvent(input);
    await nextTick();
    expect(focusEvents.length).toBe(0);
  });

  it('should format input value when stepper blurred', async () => {
    const updates: unknown[] = [];
    const blurEvents: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 5,
            min: 3,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
            onBlur: (e: unknown) => blurEvents.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;

    fireInputEvent(input, '');
    await nextTick();

    fireBlurEvent(input, '');
    await nextTick();
    await nextTick();
    // Should clamp to min (3)
    expect(updates).toContainEqual(3);
    expect(blurEvents.length).toBe(1);
  });

  it('should not format input value on blur if autoFixed is false', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            min: 5,
            max: 8,
            autoFixed: false,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;

    fireBlurEvent(input, '2');
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(2);
  });

  it('should update input width when using input-width prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, inputWidth: '10rem' });
        },
      }),
    );
    const input = container.querySelector('.van-stepper__input')!;
    expect(input.getAttribute('style')).toContain('width: 10rem');
  });

  it('should update button size when using button-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, buttonSize: '2rem' });
        },
      }),
    );
    const minus = container.querySelector('.van-stepper__minus')!;
    expect(minus.getAttribute('style')).toContain('width: 2rem');
    expect(minus.getAttribute('style')).toContain('height: 2rem');
  });

  it('should allow to use before-change prop', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            beforeChange: () => false,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should allow min value to be 0', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            min: 0,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;
    fireInputEvent(input, '');
    await nextTick();
    fireBlurEvent(input, '');
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(0);
  });

  it('should hide plus button when show-plus prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, showPlus: false });
        },
      }),
    );
    expect(container.querySelector('.van-stepper__plus')).toBeFalsy();
  });

  it('should hide minus button when show-minus prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, showMinus: false });
        },
      }),
    );
    expect(container.querySelector('.van-stepper__minus')).toBeFalsy();
  });

  it('should hide input when show-input prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, showInput: false });
        },
      }),
    );
    expect(container.querySelector('.van-stepper__input')).toBeFalsy();
  });

  it('should limit decimal length when using decimal-length prop', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const val = ref(1);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            step: 0.2,
            decimalLength: 2,
            'onUpdate:modelValue': (v: unknown) => {
              val.value = v as number;
              updates.push(v);
            },
          });
      },
    });

    const { container } = render(Comp);
    // Initial format should produce '1.00'
    await nextTick();
    expect(updates).toContainEqual('1.00');

    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual('1.20');
  });

  it('should emit change event with name when using name prop', async () => {
    const changes: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const val = ref(1);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            name: 'quantity',
            'onUpdate:modelValue': (v: unknown) => {
              val.value = v as number;
            },
            onChange: (v: unknown, detail: unknown) =>
              changes.push([v, detail]),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();
    expect(changes[0]).toEqual([2, { name: 'quantity' }]);
  });

  it('should watch min/max props and format modelValue', async () => {
    const updates: unknown[] = [];
    const min = ref(1);
    const Comp = defineComponent({
      setup() {
        const val = ref(1);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            min: min.value,
            'onUpdate:modelValue': (v: unknown) => {
              updates.push(v);
              val.value = v as number;
            },
          });
      },
    });

    render(Comp);
    min.value = 10;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(10);
  });

  it('should render placeholder correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, {
            placeholder: 'foo',
            allowEmpty: true,
            modelValue: '',
          });
        },
      }),
    );
    const input = container.querySelector('.van-stepper__input')!;
    expect(input.getAttribute('placeholder')).toEqual('foo');
  });

  it('should allow input to be empty when using allow-empty prop', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: '',
            allowEmpty: true,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;
    fireBlurEvent(input, '');
    await nextTick();
    // Should keep empty, not format to default
    expect(updates.filter((v) => v !== '')).toHaveLength(0);
  });

  it('should apply round theme class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, theme: 'round' });
        },
      }),
    );
    expect(container.querySelector('.van-stepper--round')).toBeTruthy();
  });

  it('should render icon lines in minus and plus buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1 });
        },
      }),
    );
    const minus = container.querySelector('.van-stepper__minus')!;
    const plus = container.querySelector('.van-stepper__plus')!;

    const minusLines = minus.querySelectorAll('.van-stepper__icon-line');
    expect(minusLines.length).toBe(1);

    const plusLines = plus.querySelectorAll('.van-stepper__icon-line');
    expect(plusLines.length).toBe(2);
  });

  it('should use step prop for increments', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const val = ref(0);
        return () =>
          h(Stepper, {
            modelValue: val.value,
            step: 5,
            min: 0,
            'onUpdate:modelValue': (v: unknown) => {
              val.value = v as number;
              updates.push(v);
            },
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(5);
  });

  it('should apply default value when modelValue is undefined', () => {
    const updates: unknown[] = [];
    render(
      defineComponent({
        render() {
          return h(Stepper, {
            defaultValue: 3,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
        },
      }),
    );
    expect(updates).toContainEqual(3);
  });

  it('should support before-change with Promise that resolves true', async () => {
    const updates: unknown[] = [];
    let resolvePromise: ((v: boolean) => void) | undefined;
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            beforeChange: () =>
              new Promise<boolean>((resolve) => {
                resolvePromise = resolve;
              }),
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();

    // Resolve the promise
    resolvePromise!(true);
    await nextTick();
    await nextTick();
    expect(updates).toContainEqual(2);
  });

  it('should block change when before-change returns false via Promise', async () => {
    const updates: unknown[] = [];
    let resolvePromise: ((v: boolean) => void) | undefined;
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            beforeChange: () =>
              new Promise<boolean>((resolve) => {
                resolvePromise = resolve;
              }),
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const plus = container.querySelector('.van-stepper__plus')!;
    fireEvent.tap(plus);
    await nextTick();

    // Resolve with false
    resolvePromise!(false);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should handle input-height from buttonSize prop for input', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 1, buttonSize: '40px' });
        },
      }),
    );
    const input = container.querySelector('.van-stepper__input')!;
    expect(input.getAttribute('style')).toContain('height: 40px');
  });

  it('should limit decimal-length during input', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            step: 0.2,
            decimalLength: 1,
            'onUpdate:modelValue': (v: unknown) => updates.push(v),
          });
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('.van-stepper__input')!;

    fireInputEvent(input, '1.25');
    await nextTick();
    await nextTick();
    // Should truncate to 1 decimal place: 1.2
    const lastUpdate = updates[updates.length - 1];
    expect(Number(lastUpdate)).toBeCloseTo(1.2);
  });
});
