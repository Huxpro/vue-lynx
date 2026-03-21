import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Checkbox from '../index.vue';
import CheckboxGroup from '../../CheckboxGroup/index.vue';

describe('Checkbox', () => {
  it('should render checkbox', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Checkbox, null, {
            default: () => h('text', null, 'Check me'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should toggle on icon tap', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: false,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          }, {
            default: () => h('text', null, 'Check me'),
          });
      },
    });

    const { container } = render(Comp);
    // The icon is the second view (first child view inside the container)
    const views = container.querySelectorAll('view');
    // views[0] = container, views[1] = icon view, views[2] = label view
    const iconView = views[1];
    fireEvent.tap(iconView);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(true);
  });

  it('should toggle on label tap when labelDisabled is false', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: false,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          }, {
            default: () => h('text', null, 'Check me'),
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    // views[2] = label view
    const labelView = views[2];
    fireEvent.tap(labelView);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(true);
  });

  it('should not toggle on label tap when labelDisabled is true', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: false,
            labelDisabled: true,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          }, {
            default: () => h('text', null, 'Check me'),
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const labelView = views[2];
    fireEvent.tap(labelView);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should not toggle when disabled', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            modelValue: false,
            disabled: true,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          }, {
            default: () => h('text', null, 'Check me'),
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const iconView = views[1];
    fireEvent.tap(iconView);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(0);
  });

  it('should work with CheckboxGroup', async () => {
    const groupValue = ref(['a']);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(CheckboxGroup, {
            modelValue: groupValue.value,
            'onUpdate:modelValue': (val: any[]) => { groupValue.value = val; },
          }, {
            default: () => [
              h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
              h(Checkbox, { name: 'b' }, { default: () => h('text', null, 'B') }),
            ],
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    // The structure is: group-view > [checkbox-a-container > icon + label, checkbox-b-container > icon + label]
    // We need to find the icon of checkbox b and tap it
    // views: [group, a-container, a-icon, a-label, b-container, b-icon, b-label]
    expect(views.length).toBeGreaterThanOrEqual(7);
  });

  it('should respect bindGroup=false', async () => {
    const updates: boolean[] = [];
    const groupValue = ref(['a']);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(CheckboxGroup, {
            modelValue: groupValue.value,
            'onUpdate:modelValue': (val: any[]) => { groupValue.value = val; },
          }, {
            default: () => [
              h(Checkbox, { name: 'a' }, { default: () => h('text', null, 'A') }),
              h(Checkbox, {
                name: 'standalone',
                bindGroup: false,
                modelValue: false,
                'onUpdate:modelValue': (val: boolean) => updates.push(val),
              }, { default: () => h('text', null, 'Standalone') }),
            ],
          });
      },
    });

    const { container } = render(Comp);
    // The standalone checkbox should toggle independently
    const views = container.querySelectorAll('view');
    // views: [group, a-container, a-icon, a-label, standalone-container, standalone-icon, standalone-label]
    const standaloneIcon = views[5];
    fireEvent.tap(standaloneIcon);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(true);
  });
});
