import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PickerGroup from '../index.vue';
import Picker from '../../Picker/index.vue';

const columns1 = [{ text: '1', value: '1' }];
const columns2 = [{ text: '2', value: '2' }];
const columns3 = [{ text: '3', value: '3' }];

describe('PickerGroup', () => {
  it('should render picker group with tabs and toolbar', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            { title: 'Title', tabs: ['Tab1', 'Tab2'] },
            () => [
              h(Picker, { columns: [columns1], showToolbar: false }),
              h(Picker, { columns: [columns2], showToolbar: false }),
            ],
          );
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Should have toolbar with title
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Title',
    );
    expect(hasTitle).toBe(true);

    // Should have confirm and cancel buttons
    const hasConfirm = Array.from(textEls).some(
      (t) => t.textContent === 'Confirm',
    );
    const hasCancel = Array.from(textEls).some(
      (t) => t.textContent === 'Cancel',
    );
    expect(hasConfirm).toBe(true);
    expect(hasCancel).toBe(true);

    // Should render tab titles
    const refreshedTextEls = container.querySelectorAll('text');
    const hasTab1 = Array.from(refreshedTextEls).some(
      (t) => t.textContent === 'Tab1',
    );
    const hasTab2 = Array.from(refreshedTextEls).some(
      (t) => t.textContent === 'Tab2',
    );
    expect(hasTab1).toBe(true);
    expect(hasTab2).toBe(true);
  });

  it('should emit confirm event after clicking the confirm button', async () => {
    const value1 = ref(['1']);
    const value2 = ref(['2']);
    const value3 = ref(['3']);

    const onConfirm = vi.fn();

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PickerGroup,
              {
                title: 'Title',
                tabs: ['Tab1', 'Tab2', 'Tab3'],
                onConfirm,
              },
              () => [
                h(Picker, {
                  modelValue: value1.value,
                  'onUpdate:modelValue': (v: string[]) => { value1.value = v; },
                  columns: [columns1],
                  showToolbar: false,
                }),
                h(Picker, {
                  modelValue: value2.value,
                  'onUpdate:modelValue': (v: string[]) => { value2.value = v; },
                  columns: [columns2],
                  showToolbar: false,
                }),
                h(Picker, {
                  modelValue: value3.value,
                  'onUpdate:modelValue': (v: string[]) => { value3.value = v; },
                  columns: [columns3],
                  showToolbar: false,
                }),
              ],
            );
        },
      }),
    );

    await nextTick();

    // Find and click confirm button
    const confirmEl = Array.from(container.querySelectorAll('view')).find(
      (el) => el.classList.contains('van-picker__confirm'),
    );
    expect(confirmEl).toBeTruthy();
    if (confirmEl) {
      fireEvent.tap(confirmEl);
      await nextTick();
    }

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const params = onConfirm.mock.calls[0][0];
    expect(params).toHaveLength(3);
    expect(params[0].selectedValues).toEqual(['1']);
    expect(params[1].selectedValues).toEqual(['2']);
    expect(params[2].selectedValues).toEqual(['3']);
  });

  it('should switch to next step when nextStepText is set', async () => {
    const value1 = ref(['1']);
    const value2 = ref(['2']);

    const onConfirm = vi.fn();

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PickerGroup,
              {
                title: 'Title',
                tabs: ['Tab1', 'Tab2'],
                nextStepText: 'Next Step',
                onConfirm,
              },
              () => [
                h(Picker, {
                  modelValue: value1.value,
                  'onUpdate:modelValue': (v: string[]) => { value1.value = v; },
                  columns: [columns1],
                  showToolbar: false,
                }),
                h(Picker, {
                  modelValue: value2.value,
                  'onUpdate:modelValue': (v: string[]) => { value2.value = v; },
                  columns: [columns2],
                  showToolbar: false,
                }),
              ],
            );
        },
      }),
    );

    await nextTick();

    // First click should show "Next Step" text and advance tab
    const confirmEl = Array.from(container.querySelectorAll('view')).find(
      (el) => el.classList.contains('van-picker__confirm'),
    );
    expect(confirmEl).toBeTruthy();

    // Check that confirm button says "Next Step"
    const textEls = confirmEl!.querySelectorAll('text');
    const hasNextStep = Array.from(textEls).some(
      (t) => t.textContent === 'Next Step',
    );
    expect(hasNextStep).toBe(true);

    // Click - should NOT emit confirm, should advance tab
    fireEvent.tap(confirmEl!);
    await nextTick();
    expect(onConfirm).not.toHaveBeenCalled();

    // Second click on last tab should emit confirm
    fireEvent.tap(confirmEl!);
    await nextTick();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should emit cancel event', async () => {
    const onCancel = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            {
              title: 'Title',
              tabs: ['Tab1'],
              onCancel,
            },
            () => [
              h(Picker, { columns: [columns1], showToolbar: false }),
            ],
          );
        },
      }),
    );

    await nextTick();

    // Find and click cancel button
    const cancelEl = Array.from(container.querySelectorAll('view')).find(
      (el) => el.classList.contains('van-picker__cancel'),
    );
    expect(cancelEl).toBeTruthy();
    if (cancelEl) {
      fireEvent.tap(cancelEl);
      await nextTick();
    }

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should support controlled activeTab', async () => {
    const activeTab = ref(0);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PickerGroup,
              {
                activeTab: activeTab.value,
                title: 'Title',
                tabs: ['Tab1', 'Tab2'],
                'onUpdate:activeTab': (v: number) => { activeTab.value = v; },
              },
              () => [
                h(Picker, { columns: [columns1], showToolbar: false }),
                h(Picker, { columns: [columns2], showToolbar: false }),
              ],
            );
        },
      }),
    );

    // Wait for Tabs to init (sets currentIndex after nextTick)
    await nextTick();
    await nextTick();
    await nextTick();

    // First tab should be active
    const tabs = Array.from(container.querySelectorAll('view')).filter(
      (el) => el.classList.contains('van-tab'),
    );
    expect(tabs.length).toBe(2);
    expect(tabs[0]?.classList.contains('van-tab--active')).toBe(true);

    // Change active tab externally
    activeTab.value = 1;
    await nextTick();
    await nextTick();
    await nextTick();

    const tabs2 = Array.from(container.querySelectorAll('view')).filter(
      (el) => el.classList.contains('van-tab'),
    );
    expect(tabs2[1]?.classList.contains('van-tab--active')).toBe(true);
  });

  it('should hide toolbar when showToolbar is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            {
              tabs: ['Tab1'],
              showToolbar: false,
            },
            () => [
              h(Picker, { columns: [columns1], showToolbar: false }),
            ],
          );
        },
      }),
    );

    // Should not have toolbar
    const toolbar = Array.from(container.querySelectorAll('view')).find(
      (el) => el.classList.contains('van-picker__toolbar'),
    );
    expect(toolbar).toBeFalsy();
  });

  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            { tabs: ['Tab1', 'Tab2'] },
            () => [
              h(Picker, { columns: [columns1], showToolbar: false }),
              h(Picker, { columns: [columns2], showToolbar: false }),
            ],
          );
        },
      }),
    );

    // Should have root class
    const root = container.querySelector('.van-picker-group');
    expect(root).toBeTruthy();

    // Should have tabs class
    const tabs = container.querySelector('.van-picker-group__tabs');
    expect(tabs).toBeTruthy();
  });

  it('should render with custom button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            {
              tabs: ['Tab1'],
              confirmButtonText: '确定',
              cancelButtonText: '取消',
            },
            () => [
              h(Picker, { columns: [columns1], showToolbar: false }),
            ],
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some(
      (t) => t.textContent === '确定',
    );
    const hasCancel = Array.from(textEls).some(
      (t) => t.textContent === '取消',
    );
    expect(hasConfirm).toBe(true);
    expect(hasCancel).toBe(true);
  });

  it('should render with v-for children', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            PickerGroup,
            { tabs: ['Tab1', 'Tab2'] },
            () => [1, 2].map(() =>
              h(Picker, { columns: [columns1], showToolbar: false }),
            ),
          );
        },
      }),
    );

    await nextTick();

    // Should render picker-group with tabs
    const root = container.querySelector('.van-picker-group');
    expect(root).toBeTruthy();

    const tabs = Array.from(container.querySelectorAll('view')).filter(
      (el) => el.classList.contains('van-tab'),
    );
    expect(tabs.length).toBe(2);
  });
});
