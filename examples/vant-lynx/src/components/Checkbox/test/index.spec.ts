import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Checkbox from '../index.vue';
import CheckboxGroup from '../../CheckboxGroup/index.vue';

describe('Checkbox', () => {
  it('should emit "update:modelValue" event when checkbox icon is clicked', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Checkbox,
            {
              modelValue: false,
              'onUpdate:modelValue': (val: boolean) => updates.push(val),
            },
            { default: () => h('text', null, 'Label') },
          );
      },
    });

    const { container } = render(Comp);
    // Find icon element by BEM class
    const icon = container.querySelector('.van-checkbox__icon');
    expect(icon).toBeTruthy();
    fireEvent.tap(icon!);
    await nextTick();
    expect(updates).toEqual([true]);
  });

  it('should toggle to false when already checked', async () => {
    const updates: boolean[] = [];
    const modelValue = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Checkbox,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: boolean) => {
                updates.push(val);
                modelValue.value = val;
              },
            },
            { default: () => h('text', null, 'Label') },
          );
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-checkbox__icon');
    fireEvent.tap(icon!);
    await nextTick();
    expect(updates).toEqual([false]);
  });

  it('should emit change event when modelValue is changed', async () => {
    const changes: boolean[] = [];
    const modelValue = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: modelValue.value,
            onChange: (val: boolean) => changes.push(val),
          });
      },
    });

    render(Comp);

    modelValue.value = true;
    await nextTick();
    expect(changes).toEqual([true]);

    modelValue.value = false;
    await nextTick();
    expect(changes).toEqual([true, false]);
  });

  it('should not emit "update:modelValue" event when disabled', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: false,
            disabled: true,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-checkbox__icon');
    fireEvent.tap(icon!);
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should render disabled BEM class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { disabled: true }, { default: () => h('text', null, 'Label') });
        },
      }),
    );
    const root = container.querySelector('.van-checkbox');
    expect(root?.className).toContain('van-checkbox--disabled');
  });

  it('should render "van-checkbox--label-disabled" class when using label-disabled prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { labelDisabled: true }, { default: () => h('text', null, 'Label') });
        },
      }),
    );
    const root = container.querySelector('.van-checkbox');
    expect(root?.className).toContain('van-checkbox--label-disabled');
  });

  it('should emit "update:modelValue" event when label is clicked', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Checkbox,
            {
              modelValue: false,
              'onUpdate:modelValue': (val: boolean) => updates.push(val),
            },
            { default: () => h('text', null, 'Label') },
          );
      },
    });

    const { container } = render(Comp);
    const label = container.querySelector('.van-checkbox__label');
    expect(label).toBeTruthy();
    fireEvent.tap(label!);
    await nextTick();
    expect(updates).toEqual([true]);
  });

  it('should not emit "update:modelValue" event when label is disabled and clicked', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Checkbox,
            {
              modelValue: false,
              labelDisabled: true,
              'onUpdate:modelValue': (val: boolean) => updates.push(val),
            },
            { default: () => h('text', null, 'Label') },
          );
      },
    });

    const { container } = render(Comp);
    const label = container.querySelector('.van-checkbox__label');
    fireEvent.tap(label!);
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should render label on the left when labelPosition is left', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Checkbox,
            { labelPosition: 'left' },
            { default: () => h('text', null, 'Label') },
          );
        },
      }),
    );
    const root = container.querySelector('.van-checkbox');
    const children = root?.children;
    // First child should be label, second should be icon
    expect(children?.[0]?.className).toContain('van-checkbox__label');
    expect(children?.[0]?.className).toContain('van-checkbox__label--left');
    expect(children?.[1]?.className).toContain('van-checkbox__icon');
  });

  it('should emit click event', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-checkbox__icon');
    fireEvent.tap(icon!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, null, {
            icon: ({ checked, disabled }: { checked: boolean; disabled: boolean }) =>
              h('text', null, `checked: ${checked}, disabled: ${disabled}`),
          });
        },
      }),
    );
    const iconEl = container.querySelector('.van-checkbox__icon');
    const texts = iconEl?.querySelectorAll('text');
    const found = Array.from(texts || []).find(
      (t) => t.textContent === 'checked: false, disabled: false',
    );
    expect(found).toBeTruthy();
  });

  it('should render default slot with checked and disabled scope', () => {
    const slot = vi.fn(({ checked, disabled }: { checked: boolean; disabled: boolean }) =>
      h('text', null, `${checked}-${disabled}`),
    );
    render(
      defineComponent({
        render() {
          return h(Checkbox, { modelValue: false }, { default: slot });
        },
      }),
    );
    expect(slot).toHaveBeenCalled();
    expect(slot.mock.calls[0][0]).toEqual({ checked: false, disabled: false });
  });

  it('should render round shape by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox);
        },
      }),
    );
    const icon = container.querySelector('.van-checkbox__icon');
    expect(icon?.className).toContain('van-checkbox__icon--round');
  });

  it('should render square shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { shape: 'square' });
        },
      }),
    );
    const icon = container.querySelector('.van-checkbox__icon');
    expect(icon?.className).toContain('van-checkbox__icon--square');
  });

  it('should render checked BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { modelValue: true });
        },
      }),
    );
    const icon = container.querySelector('.van-checkbox__icon');
    expect(icon?.className).toContain('van-checkbox__icon--checked');
  });

  it('should render indeterminate BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { indeterminate: true });
        },
      }),
    );
    const icon = container.querySelector('.van-checkbox__icon');
    expect(icon?.className).toContain('van-checkbox__icon--indeterminate');
  });

  it('should apply custom icon size style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, { iconSize: '24px' });
        },
      }),
    );
    const icon = container.querySelector('.van-checkbox__icon') as HTMLElement;
    expect(icon?.style.fontSize).toBe('24px');
  });
});

describe('CheckboxGroup', () => {
  it('should emit "update:modelValue" when checkbox in group is toggled', async () => {
    const updates: unknown[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: ['a'],
              'onUpdate:modelValue': (val: unknown[]) => updates.push(val),
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    // Find checkbox b's icon and click it
    const icons = container.querySelectorAll('.van-checkbox__icon');
    expect(icons.length).toBe(2);
    fireEvent.tap(icons[1]); // Click checkbox B
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toEqual(['a', 'b']);
  });

  it('should uncheck when clicking a checked checkbox in group', async () => {
    const updates: unknown[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: ['a', 'b'],
              'onUpdate:modelValue': (val: unknown[]) => updates.push(val),
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    const icons = container.querySelectorAll('.van-checkbox__icon');
    fireEvent.tap(icons[0]); // Click checkbox A to uncheck
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toEqual(['b']);
  });

  it('should respect max prop', async () => {
    const updates: unknown[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: ['a', 'b'],
              max: 2,
              'onUpdate:modelValue': (val: unknown[]) => updates.push(val),
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
                h(Checkbox, { name: 'c' }, { default: () => h('text', null, 'C') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    // Checkbox C should be disabled (overlimit)
    const checkboxes = container.querySelectorAll('.van-checkbox');
    const iconC = container.querySelectorAll('.van-checkbox__icon')[2];
    expect(iconC?.className).toContain('van-checkbox__icon--disabled');

    // Clicking C should not emit
    fireEvent.tap(iconC);
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should disable all checkboxes when group disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: [], disabled: true },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            },
          );
        },
      }),
    );
    const icons = container.querySelectorAll('.van-checkbox__icon');
    for (const icon of Array.from(icons)) {
      expect(icon.className).toContain('van-checkbox__icon--disabled');
    }
  });

  it('should apply group shape to children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: [], shape: 'square' },
            {
              default: () => [
                h(Checkbox, { name: 'a' }),
                h(Checkbox, { name: 'b' }),
              ],
            },
          );
        },
      }),
    );
    const icons = container.querySelectorAll('.van-checkbox__icon');
    for (const icon of Array.from(icons)) {
      expect(icon.className).toContain('van-checkbox__icon--square');
    }
  });

  it('should respect bindGroup=false', async () => {
    const groupUpdates: unknown[][] = [];
    const standaloneUpdates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: ['a'],
              'onUpdate:modelValue': (val: unknown[]) => groupUpdates.push(val),
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, {
                  name: 'standalone',
                  bindGroup: false,
                  modelValue: false,
                  'onUpdate:modelValue': (val: boolean) => standaloneUpdates.push(val),
                }, { default: () => h('text', null, 'Standalone') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    const icons = container.querySelectorAll('.van-checkbox__icon');
    // Standalone checkbox is the second one
    fireEvent.tap(icons[1]);
    await nextTick();
    expect(standaloneUpdates).toEqual([true]);
    expect(groupUpdates.length).toBe(0);
  });

  it('should render direction class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: [], direction: 'horizontal' },
            {
              default: () => h(Checkbox, { name: 'a' }),
            },
          );
        },
      }),
    );
    const group = container.querySelector('.van-checkbox-group');
    expect(group?.className).toContain('van-checkbox-group--horizontal');

    // Children should get horizontal direction class
    const checkbox = container.querySelector('.van-checkbox');
    expect(checkbox?.className).toContain('van-checkbox--horizontal');
  });

  it('should emit change event', async () => {
    const changes: unknown[][] = [];
    const modelValue = ref<string[]>(['a']);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(CheckboxGroup, {
            modelValue: modelValue.value,
            onChange: (val: unknown[]) => changes.push(val),
          });
      },
    });

    render(Comp);
    modelValue.value = ['a', 'b'];
    await nextTick();
    expect(changes.length).toBe(1);
    expect(changes[0]).toEqual(['a', 'b']);
  });
});
