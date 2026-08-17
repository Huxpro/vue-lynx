import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ShareSheet from '../index.vue';
import type { ShareSheetOption } from '../types';

describe('ShareSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have van-share-sheet root class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, { show: true });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const root = container.querySelector('.van-share-sheet');
    expect(root).not.toBeNull();
  });

  it('should render cancel text when using cancel-text prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            cancelText: 'foo',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-share-sheet__cancel');
    expect(cancelEl).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const cancelText = Array.from(textEls).find(
      (el) => el.textContent === 'foo',
    );
    expect(cancelText).not.toBeUndefined();
  });

  it('should not render cancel when cancelText is not set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, { show: true });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-share-sheet__cancel');
    expect(cancelEl).toBeNull();
  });

  it('should render description when using description prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            description: 'foo',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const descEl = container.querySelector('.van-share-sheet__description');
    expect(descEl).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const descText = Array.from(textEls).find(
      (el) => el.textContent === 'foo',
    );
    expect(descText).not.toBeUndefined();
  });

  it('should not render description when description is empty', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, { show: true });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const descEl = container.querySelector('.van-share-sheet__description');
    expect(descEl).toBeNull();
  });

  it('should render title when using title prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            title: 'Share',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const titleEl = container.querySelector('.van-share-sheet__title');
    expect(titleEl).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const titleText = Array.from(textEls).find(
      (el) => el.textContent === 'Share',
    );
    expect(titleText).not.toBeUndefined();
  });

  it('should render header when title and description are set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            title: 'Title',
            description: 'Desc',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const header = container.querySelector('.van-share-sheet__header');
    expect(header).not.toBeNull();
  });

  it('should allow to custom the className of option', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options: [{ name: 'Link', icon: 'link', className: 'foo' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const option = container.querySelector('.van-share-sheet__option');
    expect(option).not.toBeNull();
    if (option) {
      expect(option.className.includes('foo')).toBeTruthy();
    }
  });

  it('should emit select event when an option is clicked', async () => {
    const onSelect = vi.fn();
    const options: ShareSheetOption[] = [
      { icon: 'wechat', name: 'wechat' },
    ];

    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options,
            onSelect,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const optionEl = container.querySelector('.van-share-sheet__option');
    if (optionEl) {
      fireEvent.tap(optionEl);
      await nextTick();
      expect(onSelect).toHaveBeenCalledWith(
        { icon: 'wechat', name: 'wechat' },
        0,
      );
    }
  });

  it('should emit cancel event when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const onUpdateShow = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            cancelText: 'Cancel',
            onCancel,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-share-sheet__cancel');
    if (cancelEl) {
      fireEvent.tap(cancelEl);
      await nextTick();
      expect(onUpdateShow).toHaveBeenCalledWith(false);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  it('should render title and description slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ShareSheet,
            { show: true },
            {
              title: () => h('text', {}, 'Custom Title'),
              description: () => h('text', {}, 'Custom Description'),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const header = container.querySelector('.van-share-sheet__header');
    expect(header).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const titleText = Array.from(textEls).find(
      (el) => el.textContent === 'Custom Title',
    );
    expect(titleText).not.toBeUndefined();
    const descText = Array.from(textEls).find(
      (el) => el.textContent === 'Custom Description',
    );
    expect(descText).not.toBeUndefined();
  });

  it('should render cancel slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ShareSheet,
            { show: true, cancelText: 'Cancel' },
            {
              cancel: () => h('text', {}, 'Custom Cancel'),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancelEl = container.querySelector('.van-share-sheet__cancel');
    expect(cancelEl).not.toBeNull();
    const textEls = container.querySelectorAll('text');
    const cancelText = Array.from(textEls).find(
      (el) => el.textContent === 'Custom Cancel',
    );
    expect(cancelText).not.toBeUndefined();
  });

  it('should have van-popup--round class when round prop is true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            round: true,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const popup = container.querySelector('.van-popup--round');
    expect(popup).not.toBeNull();
  });

  it('should not have van-popup--round class when round is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            round: false,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const popup = container.querySelector('.van-popup--round');
    expect(popup).toBeNull();
  });

  it('should render named icon with icon class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options: [{ name: 'WeChat', icon: 'wechat' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const iconEl = container.querySelector('.van-share-sheet__icon');
    expect(iconEl).not.toBeNull();
    // Should have the platform-specific modifier
    const wechatIcon = container.querySelector('.van-share-sheet__icon--wechat');
    expect(wechatIcon).not.toBeNull();
  });

  it('should render image icon for URLs containing /', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options: [
              {
                name: 'Water',
                icon: 'https://example.com/custom-icon-water.png',
              },
            ],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const imageIcon = container.querySelector('.van-share-sheet__image-icon');
    expect(imageIcon).not.toBeNull();
  });

  it('should render multi-row options with border', async () => {
    const options = [
      [
        { name: 'WeChat', icon: 'wechat' },
        { name: 'Weibo', icon: 'weibo' },
      ],
      [
        { name: 'Link', icon: 'link' },
        { name: 'Poster', icon: 'poster' },
      ],
    ];

    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // Should have two options rows
    const optionsRows = container.querySelectorAll(
      '.van-share-sheet__options',
    );
    expect(optionsRows.length).toBe(2);

    // Second row should have border class
    const borderRow = container.querySelector(
      '.van-share-sheet__options--border',
    );
    expect(borderRow).not.toBeNull();
  });

  it('should render option name', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options: [{ name: 'WeChat', icon: 'wechat' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const nameEl = container.querySelector('.van-share-sheet__name');
    expect(nameEl).not.toBeNull();
    expect(nameEl?.textContent).toBe('WeChat');
  });

  it('should render option description', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            options: [
              { name: 'Link', icon: 'link', description: 'Copy link' },
            ],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const descEl = container.querySelector(
      '.van-share-sheet__option-description',
    );
    expect(descEl).not.toBeNull();
    expect(descEl?.textContent).toBe('Copy link');
  });

  it('should render cancel-gap before cancel button', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, {
            show: true,
            cancelText: 'Cancel',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const gap = container.querySelector('.van-share-sheet__cancel-gap');
    expect(gap).not.toBeNull();
  });

  it('should default round to true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet, { show: true });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const popup = container.querySelector('.van-popup--round');
    expect(popup).not.toBeNull();
  });
});
