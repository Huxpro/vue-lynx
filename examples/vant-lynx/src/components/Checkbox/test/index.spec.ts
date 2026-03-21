import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Checkbox from '../index.vue';

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

  it('should toggle on tap', async () => {
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
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(true);
  });
});
