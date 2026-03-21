import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import TimePicker from '../index.vue';

describe('TimePicker', () => {
  it('should render time picker', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render confirm and cancel buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            confirmButtonText: 'OK',
            cancelButtonText: 'Close',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some((t) => t.textContent === 'OK');
    const hasCancel = Array.from(textEls).some((t) => t.textContent === 'Close');
    expect(hasConfirm).toBe(true);
    expect(hasCancel).toBe(true);
  });

  it('should render title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, { title: 'Pick a Time' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Pick a Time');
    expect(hasTitle).toBe(true);
  });

  it('should render hour/minute column headers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasHour = Array.from(textEls).some((t) => t.textContent === 'Hour');
    const hasMinute = Array.from(textEls).some((t) => t.textContent === 'Minute');
    expect(hasHour).toBe(true);
    expect(hasMinute).toBe(true);
  });

  it('should render hour values', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, { minHour: 8, maxHour: 10 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const has08 = Array.from(textEls).some((t) => t.textContent === '08');
    expect(has08).toBe(true);
  });

  it('should emit confirm when confirm button tapped', async () => {
    const confirmed: string[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            onConfirm: (val: string[]) => confirmed.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const confirmBtn = Array.from(textEls).find((t) => t.textContent === 'Confirm');
    expect(confirmBtn).toBeTruthy();
    if (confirmBtn) {
      fireEvent.tap(confirmBtn);
      await nextTick();
      expect(confirmed.length).toBe(1);
      expect(confirmed[0].length).toBe(2);
    }
  });

  it('should emit cancel when cancel button tapped', async () => {
    const cancelled: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            onCancel: () => cancelled.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const cancelBtn = Array.from(textEls).find((t) => t.textContent === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    if (cancelBtn) {
      fireEvent.tap(cancelBtn);
      await nextTick();
      expect(cancelled.length).toBe(1);
    }
  });

  it('should initialize from modelValue', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            modelValue: ['10', '30'],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const has10 = Array.from(textEls).some((t) => t.textContent === '10');
    expect(has10).toBe(true);
  });

  it('should render with second column type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            columnsType: ['hour', 'minute', 'second'],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSecond = Array.from(textEls).some((t) => t.textContent === 'Second');
    expect(hasSecond).toBe(true);
  });
});
