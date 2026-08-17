import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Checkbox from '../../Checkbox/index.vue';
import CheckboxGroup from '../index.vue';

describe('CheckboxGroup', () => {
  it('should emit "update:modelValue" event when checkbox is clicked', async () => {
    const updates: unknown[][] = [];
    const modelValue = ref<string[]>([]);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: unknown[]) => {
                updates.push(val);
                modelValue.value = val as string[];
              },
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

    fireEvent.tap(icons[0]);
    await nextTick();
    expect(updates[0]).toEqual(['a']);

    fireEvent.tap(icons[1]);
    await nextTick();
    expect(updates[1]).toEqual(['a', 'b']);

    fireEvent.tap(icons[0]);
    await nextTick();
    expect(updates[2]).toEqual(['b']);
  });

  it('should change icon size when using icon-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: [], iconSize: '10rem' },
            {
              default: () => [
                h(Checkbox, { name: 'a' }),
                h(Checkbox, { name: 'b', iconSize: '5rem' }),
              ],
            },
          );
        },
      }),
    );

    const icons = container.querySelectorAll('.van-checkbox__icon') as NodeListOf<HTMLElement>;
    expect(icons[0].style.fontSize).toBe('10rem');
    expect(icons[1].style.fontSize).toBe('5rem');
  });

  it('should limit the number of checked items when using max prop', async () => {
    const modelValue = ref<string[]>(['a']);
    const updates: unknown[][] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: modelValue.value,
              max: 2,
              'onUpdate:modelValue': (val: unknown[]) => {
                updates.push(val);
                modelValue.value = val as string[];
              },
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
                h(Checkbox, { name: 'c' }, { default: () => h('text', null, 'C') }),
                h(Checkbox, { name: 'd' }, { default: () => h('text', null, 'D') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    const icons = container.querySelectorAll('.van-checkbox__icon');
    const checkboxes = container.querySelectorAll('.van-checkbox');

    // Click b to reach max
    fireEvent.tap(icons[1]);
    await nextTick();
    expect(modelValue.value).toEqual(['a', 'b']);

    // c should be disabled (overlimit)
    expect(checkboxes[2].className).toContain('van-checkbox--disabled');

    // Clicking c should not work
    fireEvent.tap(icons[2]);
    await nextTick();
    expect(modelValue.value).toEqual(['a', 'b']);

    // Uncheck b
    fireEvent.tap(icons[1]);
    await nextTick();
    // c should no longer be disabled
    expect(checkboxes[2].className).not.toContain('van-checkbox--disabled');
  });

  it('should change checked color when using checked-color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: ['a', 'b'], checkedColor: 'black' },
            {
              default: () => [
                h(Checkbox, { name: 'a' }),
                h(Checkbox, { name: 'b', checkedColor: 'white' }),
              ],
            },
          );
        },
      }),
    );

    const icons = container.querySelectorAll('.van-icon') as NodeListOf<HTMLElement>;
    expect(icons[0].style.backgroundColor).toBe('black');
    expect(icons[1].style.backgroundColor).toBe('white');
  });

  it('should ignore Checkbox if bind-group is false', async () => {
    const standaloneValue = ref(false);
    const groupValue = ref<string[]>([]);
    const groupRef = ref<InstanceType<typeof CheckboxGroup>>();
    const standaloneUpdates: boolean[] = [];

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: groupValue.value,
              ref: (el: any) => { groupRef.value = el; },
              'onUpdate:modelValue': (val: unknown[]) => {
                groupValue.value = val as string[];
              },
            },
            {
              default: () => [
                h(Checkbox, {
                  name: 'a',
                  bindGroup: false,
                  modelValue: standaloneValue.value,
                  'onUpdate:modelValue': (val: boolean) => {
                    standaloneUpdates.push(val);
                    standaloneValue.value = val;
                  },
                }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
                h(Checkbox, { name: 'c' }, { default: () => h('text', null, 'C') }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    const icons = container.querySelectorAll('.van-checkbox__icon');

    // Click standalone checkbox — should update its own value, not group
    fireEvent.tap(icons[0]);
    await nextTick();
    expect(standaloneUpdates).toEqual([true]);
    expect(groupValue.value).toEqual([]);

    // toggleAll should ignore the standalone checkbox
    groupRef.value?.toggleAll(true);
    await nextTick();
    expect(groupValue.value).toEqual(['b', 'c']);
  });

  it('should toggle all checkboxes when toggleAll method is called', async () => {
    const modelValue = ref<string[]>(['a']);
    const groupRef = ref<InstanceType<typeof CheckboxGroup>>();

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            {
              modelValue: modelValue.value,
              ref: (el: any) => { groupRef.value = el; },
              'onUpdate:modelValue': (val: unknown[]) => {
                modelValue.value = val as string[];
              },
            },
            {
              default: () => [
                h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
                h(Checkbox, { name: 'c', disabled: true }, { default: () => h('text', null, 'C') }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    // Toggle all (invert): a was checked → unchecked, b and c were unchecked → checked
    groupRef.value?.toggleAll();
    await nextTick();
    expect(modelValue.value).toEqual(['b', 'c']);

    // Uncheck all
    groupRef.value?.toggleAll(false);
    await nextTick();
    expect(modelValue.value).toEqual([]);

    // Check all
    groupRef.value?.toggleAll(true);
    await nextTick();
    expect(modelValue.value).toEqual(['a', 'b', 'c']);

    // Toggle with skipDisabled: a,b toggle off, c stays checked
    groupRef.value?.toggleAll({ skipDisabled: true });
    await nextTick();
    expect(modelValue.value).toEqual(['c']);

    // Check all with skipDisabled: a,b get checked, c stays checked
    groupRef.value?.toggleAll({ checked: true, skipDisabled: true });
    await nextTick();
    expect(modelValue.value).toEqual(['a', 'b', 'c']);
  });

  it('should render shape correctly when using shape prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            CheckboxGroup,
            { modelValue: [], shape: 'square' },
            {
              default: () => [
                h(Checkbox, { name: 'a' }),
                h(Checkbox, { name: 'b', shape: 'round' }),
              ],
            },
          );
        },
      }),
    );

    const icons = container.querySelectorAll('.van-checkbox__icon');
    expect(icons[0].className).toContain('van-checkbox__icon--square');
    expect(icons[1].className).toContain('van-checkbox__icon--round');
  });

  it('should emit change event when modelValue changes', async () => {
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

  it('should render direction class correctly', () => {
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

    const checkbox = container.querySelector('.van-checkbox');
    expect(checkbox?.className).toContain('van-checkbox--horizontal');
  });

  it('should disable all checkboxes when group is disabled', () => {
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
});
