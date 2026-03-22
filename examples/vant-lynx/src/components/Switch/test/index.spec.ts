import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Switch from '../index.vue';

describe('Switch', () => {
  it('should emit update:modelValue event when tapped', async () => {
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
    expect(updates).toHaveLength(1);
    expect(updates[0]).toBe(true);
  });

  it('should toggle from true to false', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: true,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(updates).toHaveLength(1);
    expect(updates[0]).toBe(false);
  });

  it('should emit change event when tapped', async () => {
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
    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(changes).toHaveLength(1);
    expect(changes[0]).toBe(true);
  });

  it('should not emit events when disabled', async () => {
    const updates: unknown[] = [];
    const changes: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            disabled: true,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
            onChange: (val: unknown) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(updates).toHaveLength(0);
    expect(changes).toHaveLength(0);
  });

  it('should not emit events when loading', async () => {
    const updates: unknown[] = [];
    const changes: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            modelValue: false,
            loading: true,
            'onUpdate:modelValue': (val: unknown) => updates.push(val),
            onChange: (val: unknown) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(updates).toHaveLength(0);
    expect(changes).toHaveLength(0);
  });

  it('should apply active color via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            modelValue: true,
            activeColor: 'black',
          });
        },
      }),
    );
    const root = container.querySelector('view')!;
    expect(root.getAttribute('style')).toContain('background-color: black');
  });

  it('should apply inactive color via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            modelValue: false,
            inactiveColor: 'black',
          });
        },
      }),
    );
    const root = container.querySelector('view')!;
    expect(root.getAttribute('style')).toContain('background-color: black');
  });

  it('should render loading indicator when loading and checked', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            loading: true,
            modelValue: true,
            activeColor: 'red',
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('should render loading indicator when loading and unchecked', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            loading: true,
            modelValue: false,
            inactiveColor: 'black',
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('should change size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            size: 20,
          });
        },
      }),
    );
    const root = container.querySelector('view')!;
    expect(root.getAttribute('style')).toContain('font-size: 20px');
  });

  it('should accept string size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, {
            size: '22px',
          });
        },
      }),
    );
    const root = container.querySelector('view')!;
    expect(root.getAttribute('style')).toContain('font-size: 22px');
  });

  it('should support custom activeValue and inactiveValue', async () => {
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
    // Should have --on class since modelValue === activeValue
    const root = container.querySelector('.van-switch--on');
    expect(root).toBeTruthy();

    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(updates[0]).toBe('off');
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
    fireEvent.tap(container.querySelector('view')!);
    await nextTick();
    await nextTick();
    expect(updates[0]).toBe(1);
  });

  it('should apply BEM class van-switch', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch);
        },
      }),
    );
    expect(container.querySelector('.van-switch')).toBeTruthy();
  });

  it('should apply van-switch--on class when checked', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, { modelValue: true });
        },
      }),
    );
    expect(container.querySelector('.van-switch--on')).toBeTruthy();
  });

  it('should apply van-switch--disabled class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, { disabled: true });
        },
      }),
    );
    expect(container.querySelector('.van-switch--disabled')).toBeTruthy();
  });

  it('should apply van-switch--loading class when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, { loading: true });
        },
      }),
    );
    expect(container.querySelector('.van-switch--loading')).toBeTruthy();
  });

  it('should render node slot when not loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, null, {
            node: () => h('text', 'Custom node'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const nodeText = Array.from(texts).find(
      (t) => t.textContent === 'Custom node',
    );
    expect(nodeText).toBeTruthy();
  });

  it('should render background slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, null, {
            background: () => h('text', 'Custom bg'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const bgText = Array.from(texts).find(
      (t) => t.textContent === 'Custom bg',
    );
    expect(bgText).toBeTruthy();
  });

  it('should not render node slot when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Switch, { loading: true }, {
            node: () => h('text', 'Custom node'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const nodeText = Array.from(texts).find(
      (t) => t.textContent === 'Custom node',
    );
    expect(nodeText).toBeFalsy();
  });
});
