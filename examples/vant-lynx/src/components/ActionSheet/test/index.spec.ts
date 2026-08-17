import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ActionSheet from '../index.vue';
import type { ActionSheetAction } from '../types';

describe('ActionSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render actions when show is true', async () => {
    const actions: ActionSheetAction[] = [
      { name: 'Option 1' },
      { name: 'Option 2' },
      { name: 'Option 3' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t: any) => t.textContent);
    expect(texts).toContain('Option 1');
    expect(texts).toContain('Option 2');
    expect(texts).toContain('Option 3');
  });

  it('should not render when show is false', () => {
    const actions: ActionSheetAction[] = [{ name: 'Option 1' }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: false, actions });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const actionTexts = Array.from(textEls).filter(
      (el: any) => el.textContent === 'Option 1',
    );
    expect(actionTexts.length).toBe(0);
  });

  it('should emit select event when clicking an action', async () => {
    const onSelect = vi.fn();
    const actions: ActionSheetAction[] = [
      { name: 'Option A' },
      { name: 'Option B' },
    ];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions,
            onSelect,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // Find the action item by its BEM class
    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      await nextTick();
      expect(onSelect).toHaveBeenCalledWith(actions[0], 0);
    }
  });

  it('should call action callback when clicking an action', async () => {
    const callback = vi.fn();
    const actions: ActionSheetAction[] = [
      { name: 'Option', callback },
    ];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      expect(callback).toHaveBeenCalledWith(actions[0]);
    }
  });

  it('should not emit select for disabled actions', async () => {
    const onSelect = vi.fn();
    const actions: ActionSheetAction[] = [{ name: 'Disabled', disabled: true }];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions,
            onSelect,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      expect(onSelect).not.toHaveBeenCalled();
    }
  });

  it('should not emit select for loading actions', async () => {
    const onSelect = vi.fn();
    const actions: ActionSheetAction[] = [{ name: 'Loading', loading: true }];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions,
            onSelect,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      expect(onSelect).not.toHaveBeenCalled();
    }
  });

  it('should render cancel button when cancelText is set', async () => {
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
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-action-sheet__cancel');
    expect(cancelEl).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const cancelText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Cancel',
    );
    expect(cancelText).not.toBeUndefined();
  });

  it('should emit cancel event when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const onUpdateShow = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
            cancelText: 'Cancel',
            onCancel,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-action-sheet__cancel');
    if (cancelEl) {
      fireEvent.tap(cancelEl);
      await nextTick();
      expect(onCancel).toHaveBeenCalled();
      expect(onUpdateShow).toHaveBeenCalledWith(false);
    }
  });

  it('should render title when provided', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Test Title',
            actions: [],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const header = container.querySelector('.van-action-sheet__header');
    expect(header).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const titleText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Test Title',
    );
    expect(titleText).not.toBeUndefined();
  });

  it('should render close icon when title and closeable are set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Title',
            closeable: true,
            actions: [],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeIcon = container.querySelector('.van-action-sheet__close');
    expect(closeIcon).not.toBeNull();
  });

  it('should not render close icon when closeable is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Title',
            closeable: false,
            actions: [],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeIcon = container.querySelector('.van-action-sheet__close');
    expect(closeIcon).toBeNull();
  });

  it('should render description when provided', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            description: 'Some description',
            actions: [],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const desc = container.querySelector('.van-action-sheet__description');
    expect(desc).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const descText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Some description',
    );
    expect(descText).not.toBeUndefined();
  });

  it('should render subname for actions', async () => {
    const actions: ActionSheetAction[] = [
      { name: 'Option', subname: 'Sub text' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const subname = container.querySelector('.van-action-sheet__subname');
    expect(subname).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const subnameText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Sub text',
    );
    expect(subnameText).not.toBeUndefined();
  });

  it('should apply color to action item', async () => {
    const actions: ActionSheetAction[] = [
      { name: 'Red Option', color: '#ee0a24' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const item = container.querySelector('.van-action-sheet__item');
    expect(item).not.toBeNull();
    if (item) {
      const style = item.getAttribute('style') || '';
      // Color may be in hex or rgb format depending on runtime
      expect(
        style.includes('#ee0a24') || style.includes('rgb(238, 10, 36)'),
      ).toBe(true);
    }
  });

  it('should apply disabled class to disabled actions', async () => {
    const actions: ActionSheetAction[] = [{ name: 'Disabled', disabled: true }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const item = container.querySelector('.van-action-sheet__item--disabled');
    expect(item).not.toBeNull();
  });

  it('should apply loading class to loading actions', async () => {
    const actions: ActionSheetAction[] = [{ name: 'Loading', loading: true }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const item = container.querySelector('.van-action-sheet__item--loading');
    expect(item).not.toBeNull();
  });

  it('should render gap before cancel button', async () => {
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
    await nextTick();
    await nextTick();

    const gap = container.querySelector('.van-action-sheet__gap');
    expect(gap).not.toBeNull();
  });

  it('should have van-action-sheet class on popup', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const actionSheet = container.querySelector('.van-action-sheet');
    expect(actionSheet).not.toBeNull();
  });

  it('should have content wrapper', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const content = container.querySelector('.van-action-sheet__content');
    expect(content).not.toBeNull();
  });

  it('should close on click action when closeOnClickAction is true', async () => {
    const onUpdateShow = vi.fn();
    const actions: ActionSheetAction[] = [{ name: 'Option' }];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions,
            closeOnClickAction: true,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      expect(onUpdateShow).toHaveBeenCalledWith(false);
    }
  });

  it('should not close on click action when closeOnClickAction is false', async () => {
    const onUpdateShow = vi.fn();
    const actions: ActionSheetAction[] = [{ name: 'Option' }];

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions,
            closeOnClickAction: false,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-action-sheet__item');
    if (items.length > 0) {
      fireEvent.tap(items[0]);
      await nextTick();
      // Should not call update:show since closeOnClickAction is false
      expect(onUpdateShow).not.toHaveBeenCalled();
    }
  });

  it('should render default slot content', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ActionSheet,
            { show: true, title: 'Title', actions: [] },
            {
              default: () => h('text', {}, 'Custom Content'),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const customText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Custom Content',
    );
    expect(customText).not.toBeUndefined();
  });

  it('should render description slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ActionSheet,
            { show: true, actions: [] },
            {
              description: () => h('text', {}, 'Custom Description'),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const desc = container.querySelector('.van-action-sheet__description');
    expect(desc).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const descText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Custom Description',
    );
    expect(descText).not.toBeUndefined();
  });

  it('should render cancel slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ActionSheet,
            { show: true, actions: [], cancelText: 'Cancel' },
            {
              cancel: () => h('text', {}, 'Custom Cancel'),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const cancelText = Array.from(textEls).find(
      (el: any) => el.textContent === 'Custom Cancel',
    );
    expect(cancelText).not.toBeUndefined();
  });

  it('should render name element with BEM class', async () => {
    const actions: ActionSheetAction[] = [{ name: 'Test Name' }];
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, { show: true, actions });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const nameEl = container.querySelector('.van-action-sheet__name');
    expect(nameEl).not.toBeNull();
  });

  it('should render round popup by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            actions: [{ name: 'Item' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // The Popup should have round class since ActionSheet defaults round=true
    const popup = container.querySelector('.van-popup--round');
    expect(popup).not.toBeNull();
  });

  it('should emit cancel when close icon is clicked', async () => {
    const onCancel = vi.fn();
    const onUpdateShow = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(ActionSheet, {
            show: true,
            title: 'Title',
            closeable: true,
            actions: [],
            onCancel,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const closeIcon = container.querySelector('.van-action-sheet__close');
    if (closeIcon) {
      fireEvent.tap(closeIcon);
      await nextTick();
      expect(onCancel).toHaveBeenCalled();
      expect(onUpdateShow).toHaveBeenCalledWith(false);
    }
  });
});
