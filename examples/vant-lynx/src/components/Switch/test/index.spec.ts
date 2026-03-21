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
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
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
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            disabled: true,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
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

  it('should not toggle when loading', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            loading: true,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
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

  it('should support custom activeValue and inactiveValue', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: 'off',
            activeValue: 'on',
            inactiveValue: 'off',
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe('on');
  });

  it('should toggle from activeValue to inactiveValue', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: 'on',
            activeValue: 'on',
            inactiveValue: 'off',
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe('off');
  });

  it('should emit change event', async () => {
    const changes: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            onChange: (val: unknown) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(changes.length).toBe(1);
    expect(changes[0]).toBe(true);
  });

  it('should support numeric activeValue and inactiveValue', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: 0,
            activeValue: 1,
            inactiveValue: 0,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(updates.length).toBe(1);
    expect(updates[0]).toBe(1);
  });
});
