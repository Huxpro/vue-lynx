import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Stepper from '../index.vue';

describe('Stepper', () => {
  it('should render stepper with value', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Stepper, { modelValue: 5 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasValue = Array.from(textEls).some(
      (t) => t.textContent === '5',
    );
    expect(hasValue).toBe(true);
  });

  it('should increment on plus tap', async () => {
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Stepper, {
            modelValue: 1,
            'onUpdate:modelValue': (v: number) => {
              updates.push(v);
            },
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    // The plus button is the last text element with content '+'
    const plusBtn = Array.from(textEls).find((t) => t.textContent === '+');
    expect(plusBtn).toBeTruthy();
    if (plusBtn) {
      fireEvent.tap(plusBtn.parentElement!);
      await nextTick();
      expect(updates).toContain(2);
    }
  });
});
