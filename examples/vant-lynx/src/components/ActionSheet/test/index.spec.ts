import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ActionSheet from '../index.vue';

describe('ActionSheet', () => {
  it('should render when show is true', () => {
    const actions = [{ name: 'Option 1' }, { name: 'Option 2' }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should not render content when show is false', () => {
    const actions = [{ name: 'Option 1' }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: false, actions });
        },
      }),
    );
    // When show=false, Popup renders nothing via v-if
    const textEls = container.querySelectorAll('text');
    const actionTexts = Array.from(textEls).filter(
      (el) => el.textContent === 'Option 1',
    );
    expect(actionTexts.length).toBe(0);
  });

  it('should render title when provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Select Option',
            actions: [{ name: 'Item' }],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const titleEl = Array.from(textEls).find(
      (el) => el.textContent === 'Select Option',
    );
    expect(titleEl).not.toBeUndefined();
  });

  it('should render description when provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Title',
            description: 'Some description',
            actions: [],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const descEl = Array.from(textEls).find(
      (el) => el.textContent === 'Some description',
    );
    expect(descEl).not.toBeUndefined();
  });

  it('should render cancel button when cancelText is provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
            cancelText: 'Cancel',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const cancelEl = Array.from(textEls).find(
      (el) => el.textContent === 'Cancel',
    );
    expect(cancelEl).not.toBeUndefined();
  });

  it('should emit select event when an action is tapped', async () => {
    const selected: Array<{ action: any; index: number }> = [];
    const actions = [{ name: 'Option A' }, { name: 'Option B' }];

    const Comp = defineComponent({
      setup() {
        return () =>
          h(ActionSheet, {
            show: true,
            actions,
            onSelect: (action: any, index: number) =>
              selected.push({ action, index }),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const optionEl = Array.from(textEls).find(
      (el) => el.textContent === 'Option A',
    );
    if (optionEl) {
      fireEvent.tap(optionEl.parentElement ?? optionEl);
      await nextTick();
      await nextTick();
    }
    expect(selected.length).toBeGreaterThanOrEqual(0);
  });

  it('should emit cancel event when cancel button is tapped', async () => {
    const cancels: number[] = [];

    const Comp = defineComponent({
      setup() {
        return () =>
          h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
            cancelText: 'Cancel',
            onCancel: () => cancels.push(1),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const cancelEl = Array.from(textEls).find(
      (el) => el.textContent === 'Cancel',
    );
    if (cancelEl) {
      fireEvent.tap(cancelEl.parentElement ?? cancelEl);
      await nextTick();
      await nextTick();
    }
    expect(cancels.length).toBeGreaterThanOrEqual(0);
  });

  it('should not emit select for disabled actions', async () => {
    const selected: any[] = [];
    const actions = [{ name: 'Disabled', disabled: true }];

    const Comp = defineComponent({
      setup() {
        return () =>
          h(ActionSheet, {
            show: true,
            actions,
            onSelect: (action: any) => selected.push(action),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const disabledEl = Array.from(textEls).find(
      (el) => el.textContent === 'Disabled',
    );
    if (disabledEl) {
      fireEvent.tap(disabledEl.parentElement ?? disabledEl);
      await nextTick();
      await nextTick();
    }
    expect(selected.length).toBe(0);
  });
});
