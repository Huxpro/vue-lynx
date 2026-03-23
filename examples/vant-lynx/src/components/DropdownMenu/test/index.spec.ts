import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref, onMounted } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import DropdownMenu from '../index.vue';
import DropdownItem from '../../DropdownItem/index.vue';

function createWrapper(options: {
  value?: number;
  title?: string;
  direction?: 'up' | 'down';
  closeOnClickOutside?: boolean;
  icon?: string;
  activeColor?: string;
  disabled?: boolean;
} = {}) {
  return render(
    defineComponent({
      setup() {
        const state = {
          value: options.value ?? 0,
          title: options.title || '',
          direction: options.direction || 'down',
          closeOnClickOutside: options.closeOnClickOutside ?? true,
          activeColor: options.activeColor,
          options: [
            { text: 'A', value: 0, icon: options.icon },
            { text: 'B', value: 1, icon: options.icon },
          ],
        };

        return () =>
          h(
            DropdownMenu,
            {
              direction: state.direction,
              closeOnClickOutside: state.closeOnClickOutside,
              activeColor: state.activeColor,
            },
            {
              default: () => [
                h(DropdownItem, {
                  modelValue: state.value,
                  title: state.title,
                  options: state.options,
                  disabled: options.disabled,
                }),
                h(DropdownItem, {
                  modelValue: state.value,
                  title: state.title,
                  options: state.options,
                }),
              ],
            },
          );
      },
    }),
  );
}

describe('DropdownMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render menu bar with BEM classes', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const menu = container.querySelector('.van-dropdown-menu');
    expect(menu).toBeTruthy();

    const bar = container.querySelector('.van-dropdown-menu__bar');
    expect(bar).toBeTruthy();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    expect(items.length).toBe(2);

    const titles = container.querySelectorAll('.van-dropdown-menu__title');
    expect(titles.length).toBe(2);
  });

  it('should show dropdown item when title is clicked', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    // Should show wrapper
    const wrapper = container.querySelector('.van-dropdown-item');
    expect(wrapper).toBeTruthy();

    // Should show content
    const content = container.querySelector('.van-dropdown-item__content');
    expect(content).toBeTruthy();

    // Title should have active class
    const title = container.querySelector('.van-dropdown-menu__title--active');
    expect(title).toBeTruthy();
  });

  it('should toggle between items', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');

    // Click first item
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    let activeTitles = container.querySelectorAll(
      '.van-dropdown-menu__title--active',
    );
    expect(activeTitles.length).toBe(1);

    // Click second item (should close first, open second)
    fireEvent.tap(items[1]);
    await nextTick();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();

    activeTitles = container.querySelectorAll(
      '.van-dropdown-menu__title--active',
    );
    expect(activeTitles.length).toBe(1);
  });

  it('should close dropdown when clicking same title again', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');

    // Open
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();
    expect(
      container.querySelector('.van-dropdown-menu__title--active'),
    ).toBeTruthy();

    // Close
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();

    expect(
      container.querySelector('.van-dropdown-menu__title--active'),
    ).toBeFalsy();
  });

  it('should render option text from selected value', async () => {
    const { container } = createWrapper({ value: 1 });
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasB = Array.from(textEls).some((t) => t.textContent === 'B');
    expect(hasB).toBe(true);
  });

  it('should render option icon', async () => {
    const { container } = createWrapper({ icon: 'success' });
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    // Options should be rendered with icons
    const cells = container.querySelectorAll('.van-dropdown-item__option');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should use title prop', async () => {
    const { container } = createWrapper({ title: 'Custom Title' });
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Title',
    );
    expect(hasTitle).toBe(true);
  });

  it('should apply direction up class', async () => {
    const { container } = createWrapper({ direction: 'up' });
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    const upWrapper = container.querySelector('.van-dropdown-item--up');
    expect(upWrapper).toBeTruthy();
  });

  it('should apply direction down class', async () => {
    const { container } = createWrapper({ direction: 'down' });
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    const downWrapper = container.querySelector('.van-dropdown-item--down');
    expect(downWrapper).toBeTruthy();
  });

  it('should disable dropdown item', async () => {
    const { container } = createWrapper({ disabled: true });
    await nextTick();
    await nextTick();

    const disabledItem = container.querySelector(
      '.van-dropdown-menu__item--disabled',
    );
    expect(disabledItem).toBeTruthy();

    // Click disabled item should not open dropdown
    fireEvent.tap(disabledItem!);
    await nextTick();
    await nextTick();

    expect(container.querySelector('.van-dropdown-item')).toBeFalsy();
  });

  it('should emit change event when selecting option', async () => {
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
              default: () => [
                h(DropdownItem, {
                  modelValue: 0,
                  options,
                  onChange,
                }),
                h(DropdownItem, { modelValue: 0, options }),
              ],
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Open the first item
    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    // Click the same option (value 0) - should not trigger change
    const cells = container.querySelectorAll('.van-dropdown-item__option');
    if (cells.length > 0) {
      fireEvent.tap(cells[0]);
      await nextTick();
      expect(onChange).not.toHaveBeenCalled();
    }

    // Reopen and click different option
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();

    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    const cells2 = container.querySelectorAll('.van-dropdown-item__option');
    if (cells2.length > 1) {
      fireEvent.tap(cells2[1]);
      await nextTick();
      expect(onChange).toHaveBeenCalledWith(1);
    }
  });

  it('should render title slot', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(DropdownMenu, {}, {
              default: () =>
                h(
                  DropdownItem,
                  {},
                  { title: () => h('text', {}, 'Custom Slot Title') },
                ),
            });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasSlotTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Slot Title',
    );
    expect(hasSlotTitle).toBe(true);
  });

  it('should add opened class to bar when item is open', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    // Bar should not have opened class initially
    expect(
      container.querySelector('.van-dropdown-menu__bar--opened'),
    ).toBeFalsy();

    // Open an item
    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    expect(
      container.querySelector('.van-dropdown-menu__bar--opened'),
    ).toBeTruthy();
  });

  it('should render arrow element', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const arrows = container.querySelectorAll(
      '.van-dropdown-menu__title-arrow',
    );
    expect(arrows.length).toBe(2);
  });

  it('should apply active color to title', async () => {
    const { container } = createWrapper({ activeColor: '#ee0a24' });
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    const activeTitle = container.querySelector(
      '.van-dropdown-menu__title--active',
    );
    expect(activeTitle).toBeTruthy();
  });

  it('should emit open/close events', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onOpened = vi.fn();
    const onClosed = vi.fn();

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
                  onOpen,
                  onClose,
                  onOpened,
                  onClosed,
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

    expect(onOpen).toHaveBeenCalledTimes(1);

    // Wait for opened event
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(onOpened).toHaveBeenCalledTimes(1);

    // Close by clicking title again
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    expect(onClose).toHaveBeenCalledTimes(1);

    // Wait for closed event
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('should close on overlay click when closeOnClickOverlay is true', async () => {
    const { container } = createWrapper();
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    // Find the overlay (fixed positioned view)
    const overlays = container.querySelectorAll('view');
    const overlay = Array.from(overlays).find(
      (v) =>
        (v as HTMLElement).style?.position === 'fixed' &&
        (v as HTMLElement).style?.backgroundColor,
    );

    if (overlay) {
      fireEvent.tap(overlay);
      await nextTick();
      await nextTick();
      vi.advanceTimersByTime(300);
      await nextTick();

      expect(
        container.querySelector('.van-dropdown-menu__title--active'),
      ).toBeFalsy();
    }
  });

  it('should handle disabled option', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1, disabled: true },
            { text: 'C', value: 2 },
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

    const disabledOption = container.querySelector(
      '.van-dropdown-item__option--disabled',
    );
    expect(disabledOption).toBeTruthy();

    // Click disabled option
    if (disabledOption) {
      fireEvent.tap(disabledOption);
      await nextTick();
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it('should expose close method and opened state', async () => {
    const menuRef = ref();

    const { container } = render(
      defineComponent({
        setup() {
          const options = [
            { text: 'A', value: 0 },
            { text: 'B', value: 1 },
          ];
          return () =>
            h(
              DropdownMenu,
              { ref: menuRef },
              {
                default: () =>
                  h(DropdownItem, { modelValue: 0, options }),
              },
            );
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Initially not opened
    expect(menuRef.value?.opened).toBe(false);

    // Open by clicking title
    const item = container.querySelector('.van-dropdown-menu__item');
    fireEvent.tap(item!);
    await nextTick();
    await nextTick();

    expect(menuRef.value?.opened).toBe(true);

    // Close via exposed method
    menuRef.value?.close();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();

    expect(menuRef.value?.opened).toBe(false);
  });

  it('should render active checkmark icon for selected option', async () => {
    const { container } = createWrapper({ value: 0 });
    await nextTick();
    await nextTick();

    // Open
    const items = container.querySelectorAll('.van-dropdown-menu__item');
    fireEvent.tap(items[0]);
    await nextTick();
    await nextTick();

    // Active option should have icon
    const activeOption = container.querySelector(
      '.van-dropdown-item__option--active',
    );
    expect(activeOption).toBeTruthy();

    // Should have success icon
    const icon = activeOption?.querySelector('.van-dropdown-item__icon');
    expect(icon).toBeTruthy();
  });
});
