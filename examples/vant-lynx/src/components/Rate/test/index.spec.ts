import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Rate from '../index.vue';

describe('Rate', () => {
  it('should emit change and update:modelValue event when rate icon is tapped', async () => {
    const changes: number[] = [];
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Rate, {
            modelValue: 0,
            'onUpdate:modelValue': (val: number) => updates.push(val),
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const items = container.querySelectorAll('.van-rate__item');
    expect(items.length).toBe(5);

    // Tap the 4th star
    fireEvent.tap(items[3]);
    await nextTick();
    await nextTick();
    expect(changes).toHaveLength(1);
    expect(changes[0]).toBe(4);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toBe(4);
  });

  it('should not emit change or update:modelValue when value is same', async () => {
    const changes: number[] = [];
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Rate, {
            modelValue: 4,
            'onUpdate:modelValue': (val: number) => updates.push(val),
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const items = container.querySelectorAll('.van-rate__item');
    // Tap the 4th star (same as modelValue)
    fireEvent.tap(items[3]);
    await nextTick();
    expect(changes).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it('should not emit change or update:modelValue when disabled', async () => {
    const changes: number[] = [];
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Rate, {
            disabled: true,
            'onUpdate:modelValue': (val: number) => updates.push(val),
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const items = container.querySelectorAll('.van-rate__item');
    fireEvent.tap(items[3]);
    await nextTick();
    expect(changes).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it('should not emit change or update:modelValue when readonly', async () => {
    const changes: number[] = [];
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Rate, {
            readonly: true,
            modelValue: 3,
            'onUpdate:modelValue': (val: number) => updates.push(val),
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const items = container.querySelectorAll('.van-rate__item');
    fireEvent.tap(items[1]);
    await nextTick();
    expect(changes).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it('should render gutter between items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { gutter: 10 });
        },
      }),
    );

    const items = container.querySelectorAll('.van-rate__item');
    // First 4 items should have paddingRight
    const firstItem = items[0];
    expect(firstItem.getAttribute('style')).toContain('padding-right');
  });

  it('should render correct count when using string prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { count: '4' as any });
        },
      }),
    );

    const items = container.querySelectorAll('.van-rate__item');
    expect(items).toHaveLength(4);
  });

  it('should apply disabled BEM class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { disabled: true });
        },
      }),
    );

    expect(container.querySelector('.van-rate--disabled')).toBeTruthy();
  });

  it('should apply readonly BEM class when readonly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { readonly: true });
        },
      }),
    );

    expect(container.querySelector('.van-rate--readonly')).toBeTruthy();
  });

  it('should render van-rate base class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate);
        },
      }),
    );

    expect(container.querySelector('.van-rate')).toBeTruthy();
  });

  it('should render 5 rate items by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { modelValue: 3 });
        },
      }),
    );

    const items = container.querySelectorAll('.van-rate__item');
    expect(items).toHaveLength(5);
  });

  it('should render full icon class for active stars', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { modelValue: 3 });
        },
      }),
    );

    const fullIcons = container.querySelectorAll('.van-rate__icon--full');
    expect(fullIcons.length).toBe(3);
  });

  it('should render half icon when using allow-half and readonly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, {
            allowHalf: true,
            readonly: true,
            modelValue: 3.3,
          });
        },
      }),
    );

    const halfIcon = container.querySelector('.van-rate__icon--half');
    expect(halfIcon).toBeTruthy();
  });

  it('should render disabled icon class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { modelValue: 3, disabled: true });
        },
      }),
    );

    const disabledIcons = container.querySelectorAll('.van-rate__icon--disabled');
    expect(disabledIcons.length).toBe(5);
  });

  it('should pass size prop to Icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { size: '2rem', modelValue: 1 });
        },
      }),
    );

    // Icon should receive the size prop
    const icon = container.querySelector('.van-rate__icon');
    expect(icon).toBeTruthy();
  });

  it('should pass color props to Icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, {
            modelValue: 3,
            color: '#ffd21e',
            voidColor: '#eee',
          });
        },
      }),
    );

    // Full icons should have custom color, void icons should have voidColor
    const icons = container.querySelectorAll('.van-rate__icon');
    expect(icons.length).toBe(5);
  });

  it('should pass disabledColor to Icon when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, {
            modelValue: 3,
            disabled: true,
            disabledColor: '#999',
          });
        },
      }),
    );

    const icons = container.querySelectorAll('.van-rate__icon--disabled');
    expect(icons.length).toBe(5);
  });
});
