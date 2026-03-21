import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Switch from '../index.vue';

describe('Switch', () => {
  it('should render switch', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should toggle on tap', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(true);
  });

  it('should not toggle when disabled', async () => {
    const updates: boolean[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            disabled: true,
            'onUpdate:modelValue': (val: boolean) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(0);
  });
});
