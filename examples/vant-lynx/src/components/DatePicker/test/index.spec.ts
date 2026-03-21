import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import DatePicker from '../index.vue';

describe('DatePicker', () => {
  it('should render date picker', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker);
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
          return h(DatePicker, {
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
          return h(DatePicker, { title: 'Pick a Date' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Pick a Date');
    expect(hasTitle).toBe(true);
  });

  it('should render year/month/day column headers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasYear = Array.from(textEls).some((t) => t.textContent === 'Year');
    const hasMonth = Array.from(textEls).some((t) => t.textContent === 'Month');
    const hasDay = Array.from(textEls).some((t) => t.textContent === 'Day');
    expect(hasYear).toBe(true);
    expect(hasMonth).toBe(true);
    expect(hasDay).toBe(true);
  });

  it('should emit confirm when confirm button tapped', async () => {
    const confirmed: string[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
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
      expect(confirmed[0].length).toBeGreaterThan(0);
    }
  });

  it('should emit cancel when cancel button tapped', async () => {
    const cancelled: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
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
          return h(DatePicker, {
            modelValue: ['2024', '06', '15'],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const has2024 = Array.from(textEls).some((t) => t.textContent === '2024');
    expect(has2024).toBe(true);
  });

  it('should render year-month type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, { type: 'year-month' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasYear = Array.from(textEls).some((t) => t.textContent === 'Year');
    const hasMonth = Array.from(textEls).some((t) => t.textContent === 'Month');
    expect(hasYear).toBe(true);
    expect(hasMonth).toBe(true);
  });
});
