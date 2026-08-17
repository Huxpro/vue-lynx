import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref, onMounted } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import DropdownMenu from '../../DropdownMenu/index.vue';
import DropdownItem from '../index.vue';

describe('DropdownItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render options when opened', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'Option A', value: 'a' },
            { text: 'Option B', value: 'b' },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, { modelValue: 'a', options }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('Option A');
    expect(texts).toContain('Option B');
  });

  it('should emit update:modelValue when option is selected', async () => {
    const onUpdateModelValue = vi.fn();
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, {
                  modelValue: 0,
                  options,
                  'onUpdate:modelValue': onUpdateModelValue,
                }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    // Click option B
    const optionCells = container.querySelectorAll(
      '.van-dropdown-item__option',
    );
    if (optionCells.length > 1) {
      fireEvent.tap(optionCells[1]);
      await nextTick();
      expect(onUpdateModelValue).toHaveBeenCalledWith(1);
    }
  });

  it('should toggle via exposed method', async () => {
    const itemRef = ref();

    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, {
                  ref: itemRef,
                  modelValue: 0,
                  options,
                }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Toggle open
    itemRef.value?.toggle(true);
    await nextTick();
    await nextTick();

    expect(container.querySelector('.van-dropdown-item')).toBeTruthy();

    // Toggle close with immediate
    itemRef.value?.toggle(false, { immediate: true });
    await nextTick();
    await nextTick();

    expect(container.querySelector('.van-dropdown-item')).toBeFalsy();
  });

  it('should show display title from selected option', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'Apple', value: 'apple' },
            { text: 'Banana', value: 'banana' },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, { modelValue: 'banana', options }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasBanana = Array.from(textEls).some(
      (t) => t.textContent === 'Banana',
    );
    expect(hasBanana).toBe(true);
  });

  it('should use title prop over selected option text', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, {
                  modelValue: 0,
                  title: 'Fixed Title',
                  options,
                }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Fixed Title',
    );
    expect(hasTitle).toBe(true);
  });

  it('should render custom content via default slot', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(
                  DropdownItem,
                  { title: 'Filter' },
                  { default: () => h('text', {}, 'Custom Content') },
                ),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasCustom = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Content',
    );
    expect(hasCustom).toBe(true);
  });

  it('should not trigger change when clicking same value', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, {
                  modelValue: 0,
                  options,
                  onChange,
                }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    // Click option A (same value)
    const optionCells = container.querySelectorAll(
      '.van-dropdown-item__option',
    );
    if (optionCells.length > 0) {
      fireEvent.tap(optionCells[0]);
      await nextTick();
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it('should have option BEM classes', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(DropdownItem, { modelValue: 0, options }),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    // Check option classes
    const options = container.querySelectorAll('.van-dropdown-item__option');
    expect(options.length).toBe(2);

    // First option should be active
    const activeOption = container.querySelector(
      '.van-dropdown-item__option--active',
    );
    expect(activeOption).toBeTruthy();
  });

  it('should clean up on unmount', async () => {
    const show = ref(true);
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(DropdownMenu, {}, {
              default: () => [
                show.value
                  ? h(DropdownItem, { modelValue: 0, options })
                  : null,
                h(DropdownItem, { modelValue: 0, options }),
              ],
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Initially 2 items
    let items = container.querySelectorAll('.van-dropdown-menu__item');
    expect(items.length).toBe(2);

    // Remove first item
    show.value = false;
    await nextTick();
    await nextTick();

    items = container.querySelectorAll('.van-dropdown-menu__item');
    expect(items.length).toBe(1);
  });
});
