import { describe, it, expect, vi } from 'vitest';
import { h, ref, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NumberKeyboard from '../index.vue';

describe('NumberKeyboard', () => {
  it('should not render when show has never been true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: false });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard')).toBeFalsy();
  });

  it('should render keyboard when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard')).toBeTruthy();
    const keys = container.querySelectorAll('.van-key__wrapper');
    expect(keys.length).toBe(12);
  });

  it('should emit input event after tapping number key', async () => {
    const inputs: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            onInput: (key: string) => inputs.push(key),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');
    fireEvent.tap(keys[0]);
    await nextTick();
    expect(inputs).toContain('1');
  });

  it('should emit delete event after tapping delete key', async () => {
    const deletes: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            onDelete: () => deletes.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');
    fireEvent.tap(keys[11]);
    await nextTick();
    expect(deletes.length).toBe(1);
  });

  it('should emit blur event after tapping collapse key when shown', async () => {
    const blurs: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            onBlur: () => blurs.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');
    // Key at index 9 is the extra key (collapse) with empty text
    fireEvent.tap(keys[9]);
    await nextTick();
    expect(blurs.length).toBe(1);
  });

  it('should not emit blur event when hidden', () => {
    const blurs: boolean[] = [];
    const inputs: string[] = [];
    render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: false,
            onBlur: () => blurs.push(true),
            onInput: (k: string) => inputs.push(k),
          });
        },
      }),
    );
    expect(blurs.length).toBe(0);
    expect(inputs.length).toBe(0);
  });

  it('should emit close and blur events in custom theme sidebar', async () => {
    const closes: boolean[] = [];
    const blurs: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            onClose: () => closes.push(true),
            onBlur: () => blurs.push(true),
          });
      },
    });

    const { container } = render(Comp);
    const sidebar = container.querySelector('.van-number-keyboard__sidebar');
    expect(sidebar).toBeTruthy();

    // Find the close key in sidebar (the blue key wrapper)
    const sidebarWrappers = sidebar!.querySelectorAll('.van-key__wrapper');
    // Last wrapper in sidebar is the close key
    const closeWrapper = sidebarWrappers[sidebarWrappers.length - 1];
    fireEvent.tap(closeWrapper);
    await nextTick();
    expect(closes.length).toBe(1);
    expect(blurs.length).toBe(1);
  });

  it('should emit show/hide events when transition is disabled', async () => {
    const shows: boolean[] = [];
    const hides: boolean[] = [];
    const showRef = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: showRef.value,
            transition: false,
            onShow: () => shows.push(true),
            onHide: () => hides.push(true),
          });
      },
    });

    render(Comp);
    showRef.value = true;
    await nextTick();
    await nextTick();
    expect(shows.length).toBe(1);

    showRef.value = false;
    await nextTick();
    await nextTick();
    expect(hides.length).toBe(1);
  });

  it('should render title and close button correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            title: 'Title',
            closeButtonText: 'Close',
          });
        },
      }),
    );
    const header = container.querySelector('.van-number-keyboard__header');
    expect(header).toBeTruthy();
    const title = container.querySelector('.van-number-keyboard__title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('Title');
  });

  it('should render title-left slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true }, {
            'title-left': () => h('text', 'Custom Title Left'),
          });
        },
      }),
    );
    const header = container.querySelector('.van-number-keyboard__header');
    expect(header).toBeTruthy();
    const titleLeft = container.querySelector('.van-number-keyboard__title-left');
    expect(titleLeft).toBeTruthy();
  });

  it('should render extra key correctly when using extra-key prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            extraKey: 'foo',
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents).toContain('foo');
  });

  it('should render extra-key slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true }, {
            'extra-key': () => h('text', 'Custom Extra Key'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const found = Array.from(texts).find((t) => t.textContent === 'Custom Extra Key');
    expect(found).toBeTruthy();
  });

  it('should render zero key with wider class when extra-key is empty array in custom theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            extraKey: [],
          });
        },
      }),
    );
    const widerKey = container.querySelector('.van-key__wrapper--wider');
    expect(widerKey).toBeTruthy();
  });

  it('should render delete slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true }, {
            delete: () => h('text', 'Custom Delete Key'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const found = Array.from(texts).find((t) => t.textContent === 'Custom Delete Key');
    expect(found).toBeTruthy();
  });

  it('should render delete slot in custom theme sidebar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true, theme: 'custom' }, {
            delete: () => h('text', 'Custom Delete Key'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const found = Array.from(texts).filter((t) => t.textContent === 'Custom Delete Key');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit update:modelValue event after tapping key', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            modelValue: '',
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');
    fireEvent.tap(keys[0]); // key "1"
    await nextTick();
    expect(updates[0]).toBe('1');
  });

  it('should limit max length of modelValue when using maxlength prop', async () => {
    const inputs: string[] = [];
    const updates: string[] = [];
    const modelRef = ref('');

    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            modelValue: modelRef.value,
            maxlength: 1,
            onInput: (k: string) => inputs.push(k),
            'onUpdate:modelValue': (val: string) => {
              updates.push(val);
              modelRef.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');

    fireEvent.tap(keys[0]); // key "1"
    await nextTick();
    expect(inputs.length).toBe(1);
    expect(updates[0]).toBe('1');

    await nextTick();
    fireEvent.tap(keys[1]); // key "2"
    await nextTick();
    // Should not allow input beyond maxlength
    expect(inputs.length).toBe(1);
  });

  it('should not render delete key when show-delete-key is false', async () => {
    const showDelete = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            showDeleteKey: showDelete.value,
          });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('.van-key--delete')).toBeTruthy();

    showDelete.value = false;
    await nextTick();
    await nextTick();
    expect(container.querySelector('.van-key--delete')).toBeFalsy();
  });

  it('should render loading icon when using close-button-loading prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            closeButtonLoading: true,
          });
        },
      }),
    );
    expect(container.querySelector('.van-key__loading-icon')).toBeTruthy();
  });

  it('should shuffle key order when using random-key-order prop', async () => {
    const inputs: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            randomKeyOrder: true,
            onInput: (k: string) => inputs.push(k),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');

    for (let i = 0; i < 9; i++) {
      fireEvent.tap(keys[i]);
      await nextTick();
    }

    expect(inputs.length).toBe(9);
    // All 9 digits should be present (just in different order)
    const sorted = [...inputs].sort();
    expect(sorted).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('should not emit blur when blur-on-close is false', async () => {
    const blurs: boolean[] = [];
    const closes: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            blurOnClose: false,
            onClose: () => closes.push(true),
            onBlur: () => blurs.push(true),
          });
      },
    });

    const { container } = render(Comp);
    // Find the close key in sidebar
    const sidebar = container.querySelector('.van-number-keyboard__sidebar');
    const sidebarWrappers = sidebar!.querySelectorAll('.van-key__wrapper');
    const closeWrapper = sidebarWrappers[sidebarWrappers.length - 1];
    fireEvent.tap(closeWrapper);
    await nextTick();
    expect(closes.length).toBe(1);
    expect(blurs.length).toBe(0);
  });

  it('should apply with-title class when title is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            title: 'My Title',
          });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard--with-title')).toBeTruthy();
  });

  it('should apply unfit class when safe-area-inset-bottom is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            safeAreaInsetBottom: false,
          });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard--unfit')).toBeTruthy();
  });

  it('should render sidebar in custom theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            closeButtonText: 'Done',
          });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard__sidebar')).toBeTruthy();
    expect(container.querySelector('.van-key--blue')).toBeTruthy();
  });

  it('should not render sidebar in default theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard__sidebar')).toBeFalsy();
  });

  it('should render with custom z-index', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            zIndex: 200,
          });
        },
      }),
    );
    const root = container.querySelector('.van-number-keyboard');
    const style = root?.getAttribute('style') || '';
    expect(style).toContain('z-index');
  });

  it('should render custom theme with two extra keys', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            extraKey: ['00', '.'],
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents).toContain('00');
    expect(textContents).toContain('.');
  });

  it('should apply BEM class van-number-keyboard', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard')).toBeTruthy();
  });

  it('should render body and keys elements', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true });
        },
      }),
    );
    expect(container.querySelector('.van-number-keyboard__body')).toBeTruthy();
    expect(container.querySelector('.van-number-keyboard__keys')).toBeTruthy();
  });

  it('should render header when closeButtonText is set in default theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            closeButtonText: 'Done',
          });
        },
      }),
    );
    const header = container.querySelector('.van-number-keyboard__header');
    expect(header).toBeTruthy();
    const closeBtn = container.querySelector('.van-number-keyboard__close');
    expect(closeBtn).toBeTruthy();
  });

  it('should handle delete on modelValue', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            modelValue: '123',
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const keys = container.querySelectorAll('.van-key__wrapper');
    // Delete key is at index 11
    fireEvent.tap(keys[11]);
    await nextTick();
    expect(updates[0]).toBe('12');
  });

  it('should render wider key in custom theme with single extra key', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, {
            show: true,
            theme: 'custom',
            extraKey: '.',
          });
        },
      }),
    );
    const widerKey = container.querySelector('.van-key__wrapper--wider');
    expect(widerKey).toBeTruthy();
  });
});
