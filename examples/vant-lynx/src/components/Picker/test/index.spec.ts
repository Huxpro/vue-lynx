import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Picker from '../index.vue';

describe('Picker', () => {
  it('should render picker with toolbar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            title: 'Select City',
            columns: [['Beijing', 'Shanghai', 'Guangzhou']],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Select City');
    expect(hasTitle).toBe(true);
  });

  it('should render confirm and cancel buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            confirmButtonText: 'OK',
            cancelButtonText: 'Close',
            columns: [['A', 'B']],
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

  it('should render column items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [['Apple', 'Banana', 'Cherry']],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasApple = Array.from(textEls).some((t) => t.textContent === 'Apple');
    const hasBanana = Array.from(textEls).some((t) => t.textContent === 'Banana');
    expect(hasApple).toBe(true);
    expect(hasBanana).toBe(true);
  });

  it('should emit confirm with selected values', async () => {
    const confirmed: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Picker, {
            columns: [['Red', 'Green', 'Blue']],
            onConfirm: (params: any) => confirmed.push(params),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const confirmBtn = Array.from(textEls).find((t) => t.textContent === 'Confirm');
    expect(confirmBtn).toBeTruthy();
    // Tap the confirm button text or its parent element
    if (confirmBtn) {
      fireEvent.tap(confirmBtn.parentElement || confirmBtn);
      await nextTick();
      expect(confirmed.length).toBe(1);
      expect(confirmed[0].selectedValues).toEqual(['Red']);
    }
  });

  it('should emit cancel when cancel button tapped', async () => {
    const cancelled: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Picker, {
            columns: [['A', 'B']],
            onCancel: (params: any) => cancelled.push(params),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const cancelBtn = Array.from(textEls).find((t) => t.textContent === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    if (cancelBtn) {
      fireEvent.tap(cancelBtn.parentElement || cancelBtn);
      await nextTick();
      expect(cancelled.length).toBe(1);
    }
  });

  it('should emit change when item is selected', async () => {
    const changes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Picker, {
            columns: [['One', 'Two', 'Three']],
            onChange: (params: any) =>
              changes.push(params),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const twoItem = Array.from(textEls).find((t) => t.textContent === 'Two');
    if (twoItem) {
      const tapTarget = twoItem.parentElement || twoItem;
      fireEvent.tap(tapTarget);
      await nextTick();
      expect(changes.length).toBe(1);
      expect(changes[0].selectedValues).toEqual(['Two']);
    }
  });

  it('should not emit confirm when loading', async () => {
    const confirmed: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Picker, {
            columns: [['A', 'B']],
            loading: true,
            onConfirm: (params: any) => confirmed.push(params),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const confirmBtn = Array.from(textEls).find((t) => t.textContent === 'Confirm');
    if (confirmBtn) {
      fireEvent.tap(confirmBtn);
      await nextTick();
      expect(confirmed.length).toBe(0);
    }
  });
});
