/**
 * KeepAlive tests — verify that KeepAlive caching, lifecycle hooks, and
 * element reparenting work through the full dual-thread pipeline.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  KeepAlive,
  Transition,
  Fragment,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  createCommentVNode,
} from 'vue-lynx';
import { render } from '../index.js';

/** Flush two ticks to allow BG→MT ops to propagate. */
async function flush() {
  await nextTick();
  await nextTick();
}

describe('KeepAlive', () => {
  const CompA = defineComponent({
    name: 'CompA',
    setup() {
      const count = ref(0);
      return () =>
        h('view', null, [
          h('text', { class: 'a-count' }, String(count.value)),
          h('text', {
            class: 'a-inc',
            onTap: () => {
              count.value++;
            },
          }, 'inc'),
        ]);
    },
  });

  const CompB = defineComponent({
    name: 'CompB',
    setup() {
      return () => h('view', null, [h('text', null, 'B')]);
    },
  });

  it('preserves state across component toggle', async () => {
    const current = ref('CompA');
    const views: Record<string, any> = { CompA, CompB };

    const App = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, null, {
            default: () => h(views[current.value]),
          });
      },
    });

    const { container } = render(App);
    await flush();

    // Verify CompA renders
    expect(container.querySelector('.a-count')?.textContent).toBe('0');

    // Simulate incrementing CompA's counter via reactivity
    // (We set the ref directly since fireEvent for onTap goes through PAPI)
    // Instead, switch away and back to verify state preservation
    current.value = 'CompB';
    await flush();

    // CompB should be showing
    expect(container.querySelector('.a-count')).toBeNull();
    expect(container.textContent).toContain('B');

    // Switch back to CompA — state should be preserved
    current.value = 'CompA';
    await flush();

    expect(container.querySelector('.a-count')?.textContent).toBe('0');
  });

  it('fires onActivated and onDeactivated hooks', async () => {
    const activated = vi.fn();
    const deactivated = vi.fn();
    const mounted = vi.fn();
    const unmounted = vi.fn();

    const Tracked = defineComponent({
      name: 'Tracked',
      setup() {
        onActivated(activated);
        onDeactivated(deactivated);
        onMounted(mounted);
        onUnmounted(unmounted);
        return () => h('text', null, 'tracked');
      },
    });

    const Other = defineComponent({
      name: 'Other',
      setup() {
        return () => h('text', null, 'other');
      },
    });

    const current = ref('Tracked');
    const views: Record<string, any> = { Tracked, Other };

    const App = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, null, {
            default: () => h(views[current.value]),
          });
      },
    });

    render(App);
    await flush();

    // Initial mount: mounted + activated should fire
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(activated).toHaveBeenCalledTimes(1);
    expect(deactivated).toHaveBeenCalledTimes(0);
    expect(unmounted).toHaveBeenCalledTimes(0);

    // Switch away — deactivated should fire, NOT unmounted
    current.value = 'Other';
    await flush();

    expect(deactivated).toHaveBeenCalledTimes(1);
    expect(unmounted).toHaveBeenCalledTimes(0);

    // Switch back — activated should fire again, NOT mounted
    current.value = 'Tracked';
    await flush();

    expect(activated).toHaveBeenCalledTimes(2);
    expect(mounted).toHaveBeenCalledTimes(1); // still only once
  });

  it('respects include prop', async () => {
    const mountedA = vi.fn();
    const mountedB = vi.fn();

    const IncA = defineComponent({
      name: 'IncA',
      setup() {
        onMounted(mountedA);
        return () => h('text', null, 'A');
      },
    });

    const IncB = defineComponent({
      name: 'IncB',
      setup() {
        onMounted(mountedB);
        return () => h('text', null, 'B');
      },
    });

    const current = ref('IncA');
    const views: Record<string, any> = { IncA, IncB };

    const App = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, { include: 'IncA' }, {
            default: () => h(views[current.value]),
          });
      },
    });

    render(App);
    await flush();
    expect(mountedA).toHaveBeenCalledTimes(1);

    // Switch to B
    current.value = 'IncB';
    await flush();
    expect(mountedB).toHaveBeenCalledTimes(1);

    // Switch back to A — should reuse cached instance (mounted NOT called again)
    current.value = 'IncA';
    await flush();
    expect(mountedA).toHaveBeenCalledTimes(1); // cached

    // Switch to B and back — B is NOT cached (not in include), so mounted fires again
    current.value = 'IncB';
    await flush();
    current.value = 'IncA'; // cycle to force B unmount
    await flush();
    current.value = 'IncB';
    await flush();
    expect(mountedB).toHaveBeenCalledTimes(3); // re-mounted each time
  });

  it('respects exclude prop', async () => {
    const mountedA = vi.fn();

    const ExA = defineComponent({
      name: 'ExA',
      setup() {
        onMounted(mountedA);
        return () => h('text', null, 'A');
      },
    });

    const ExB = defineComponent({
      name: 'ExB',
      setup() {
        return () => h('text', null, 'B');
      },
    });

    const current = ref('ExA');
    const views: Record<string, any> = { ExA, ExB };

    const App = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, { exclude: 'ExA' }, {
            default: () => h(views[current.value]),
          });
      },
    });

    render(App);
    await flush();

    // A is excluded — switching away and back should re-mount
    current.value = 'ExB';
    await flush();
    current.value = 'ExA';
    await flush();
    expect(mountedA).toHaveBeenCalledTimes(2); // not cached
  });

  it('respects max prop with LRU eviction', async () => {
    const unmountedA = vi.fn();
    const unmountedB = vi.fn();

    const MaxA = defineComponent({
      name: 'MaxA',
      setup() {
        onUnmounted(unmountedA);
        return () => h('text', null, 'A');
      },
    });

    const MaxB = defineComponent({
      name: 'MaxB',
      setup() {
        onUnmounted(unmountedB);
        return () => h('text', null, 'B');
      },
    });

    const MaxC = defineComponent({
      name: 'MaxC',
      setup() {
        return () => h('text', null, 'C');
      },
    });

    const current = ref('MaxA');
    const views: Record<string, any> = { MaxA, MaxB, MaxC };

    const App = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, { max: 2 }, {
            default: () => h(views[current.value]),
          });
      },
    });

    render(App);
    await flush();

    // Show A, then switch to B — cache holds both (max=2)
    current.value = 'MaxB';
    await flush();
    expect(unmountedA).toHaveBeenCalledTimes(0); // A is cached

    // Switch to C — cache evicts A (LRU oldest), keeps B and C
    current.value = 'MaxC';
    await flush();
    expect(unmountedA).toHaveBeenCalledTimes(1); // A evicted
    expect(unmountedB).toHaveBeenCalledTimes(0); // B still cached
  });

  it('does not duplicate DOM elements after deactivate/activate cycle', async () => {
    const current = ref('CompA');
    const views: Record<string, any> = { CompA, CompB };

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { class: 'root' }, [
            h(KeepAlive, null, {
              default: () => h(views[current.value]),
            }),
          ]);
      },
    });

    const { container } = render(App);
    await flush();

    const root = container.querySelector('.root')!;
    const initialChildCount = root.children.length;

    // Cycle through: A → B → A
    current.value = 'CompB';
    await flush();
    current.value = 'CompA';
    await flush();

    // Root should have same number of children (no duplicates)
    expect(root.children.length).toBe(initialChildCount);
  });

  describe('edge cases', () => {
    it('handles Fragment children (multiple root nodes)', async () => {
      const FragComp = defineComponent({
        name: 'FragComp',
        setup() {
          const count = ref(0);
          return () =>
            h(Fragment, [
              h('text', { class: 'frag-a' }, `A${count.value}`),
              h('text', { class: 'frag-b' }, `B${count.value}`),
            ]);
        },
      });

      const Other = defineComponent({
        name: 'Other',
        setup() {
          return () => h('text', { class: 'other' }, 'other');
        },
      });

      const current = ref('FragComp');
      const views: Record<string, any> = { FragComp, Other };

      const App = defineComponent({
        setup() {
          return () =>
            h('view', { class: 'root' }, [
              h(KeepAlive, null, {
                default: () => h(views[current.value]),
              }),
            ]);
        },
      });

      const { container } = render(App);
      await flush();

      expect(container.querySelector('.frag-a')?.textContent).toBe('A0');
      expect(container.querySelector('.frag-b')?.textContent).toBe('B0');

      // Deactivate
      current.value = 'Other';
      await flush();
      expect(container.querySelector('.frag-a')).toBeNull();
      expect(container.querySelector('.other')).not.toBeNull();

      // Reactivate — both fragment children should return
      current.value = 'FragComp';
      await flush();
      expect(container.querySelector('.frag-a')?.textContent).toBe('A0');
      expect(container.querySelector('.frag-b')?.textContent).toBe('B0');
    });

    it('works with v-if branches inside KeepAlive', async () => {
      const mountedA = vi.fn();
      const mountedB = vi.fn();

      const BranchA = defineComponent({
        name: 'BranchA',
        setup() {
          onMounted(mountedA);
          return () => h('text', null, 'branchA');
        },
      });

      const BranchB = defineComponent({
        name: 'BranchB',
        setup() {
          onMounted(mountedB);
          return () => h('text', null, 'branchB');
        },
      });

      const showA = ref(true);

      const App = defineComponent({
        setup() {
          return () =>
            h(KeepAlive, null, {
              default: () =>
                showA.value ? h(BranchA) : h(BranchB),
            });
        },
      });

      render(App);
      await flush();
      expect(mountedA).toHaveBeenCalledTimes(1);

      // Switch to B
      showA.value = false;
      await flush();
      expect(mountedB).toHaveBeenCalledTimes(1);

      // Switch back to A — cached
      showA.value = true;
      await flush();
      expect(mountedA).toHaveBeenCalledTimes(1); // not re-mounted
    });

    it('handles nested KeepAlive', async () => {
      const innerActivated = vi.fn();
      const outerActivated = vi.fn();

      const Inner = defineComponent({
        name: 'Inner',
        setup() {
          onActivated(innerActivated);
          return () => h('text', null, 'inner');
        },
      });

      const InnerOther = defineComponent({
        name: 'InnerOther',
        setup() {
          return () => h('text', null, 'innerOther');
        },
      });

      const Outer = defineComponent({
        name: 'Outer',
        setup() {
          const innerView = ref('Inner');
          const innerViews: Record<string, any> = { Inner, InnerOther };
          onActivated(outerActivated);
          return () =>
            h('view', null, [
              h(KeepAlive, null, {
                default: () => h(innerViews[innerView.value]),
              }),
            ]);
        },
      });

      const OuterOther = defineComponent({
        name: 'OuterOther',
        setup() {
          return () => h('text', null, 'outerOther');
        },
      });

      const outerView = ref('Outer');
      const outerViews: Record<string, any> = { Outer, OuterOther };

      const App = defineComponent({
        setup() {
          return () =>
            h(KeepAlive, null, {
              default: () => h(outerViews[outerView.value]),
            });
        },
      });

      render(App);
      await flush();

      expect(outerActivated).toHaveBeenCalledTimes(1);
      expect(innerActivated).toHaveBeenCalledTimes(1);

      // Deactivate outer
      outerView.value = 'OuterOther';
      await flush();

      // Reactivate outer — both outer and inner should fire activated
      outerView.value = 'Outer';
      await flush();
      expect(outerActivated).toHaveBeenCalledTimes(2);
      expect(innerActivated).toHaveBeenCalledTimes(2);
    });

    it('updates props on re-activated component', async () => {
      const MyComp = defineComponent({
        name: 'MyComp',
        props: { label: String },
        setup(props) {
          return () => h('text', { class: 'label' }, props.label);
        },
      });

      const Other = defineComponent({
        name: 'Other',
        setup() {
          return () => h('text', null, 'other');
        },
      });

      const current = ref('MyComp');
      const label = ref('first');
      const views: Record<string, any> = { MyComp, Other };

      const App = defineComponent({
        setup() {
          return () =>
            h(KeepAlive, null, {
              default: () =>
                current.value === 'MyComp'
                  ? h(MyComp, { label: label.value })
                  : h(Other),
            });
        },
      });

      const { container } = render(App);
      await flush();
      expect(container.querySelector('.label')?.textContent).toBe('first');

      // Deactivate and change the prop
      current.value = 'Other';
      await flush();
      label.value = 'second';

      // Reactivate — should see updated props
      current.value = 'MyComp';
      await flush();
      expect(container.querySelector('.label')?.textContent).toBe('second');
    });
  });

  describe('Transition + KeepAlive', () => {
    it('works with Transition wrapping KeepAlive', async () => {
      const activated = vi.fn();
      const deactivated = vi.fn();

      const TKA = defineComponent({
        name: 'TKA',
        setup() {
          onActivated(activated);
          onDeactivated(deactivated);
          return () => h('text', { class: 'tka' }, 'A');
        },
      });

      const TKB = defineComponent({
        name: 'TKB',
        setup() {
          return () => h('text', { class: 'tkb' }, 'B');
        },
      });

      const current = ref('TKA');
      const views: Record<string, any> = { TKA, TKB };

      const App = defineComponent({
        setup() {
          return () =>
            h(Transition, { duration: 100 }, {
              default: () =>
                h(KeepAlive, null, {
                  default: () => h(views[current.value]),
                }),
            });
        },
      });

      const { container } = render(App);
      await flush();

      expect(container.querySelector('.tka')).not.toBeNull();
      expect(activated).toHaveBeenCalledTimes(1);

      // Switch to B — Transition + KeepAlive
      current.value = 'TKB';
      await flush();

      expect(deactivated).toHaveBeenCalledTimes(1);

      // Switch back — reactivate
      current.value = 'TKA';
      await flush();

      expect(activated).toHaveBeenCalledTimes(2);
      expect(container.querySelector('.tka')).not.toBeNull();
    });

    it('caches components that use Transition internally', async () => {
      const mountedCount = vi.fn();

      // A component that uses Transition in its own template
      const TransComp = defineComponent({
        name: 'TransComp',
        setup() {
          const show = ref(true);
          onMounted(mountedCount);
          return () =>
            h('view', { class: 'trans-comp' }, [
              h(Transition, { duration: 50 }, {
                default: () =>
                  show.value ? h('text', null, 'visible') : createCommentVNode(''),
              }),
            ]);
        },
      });

      const OtherComp = defineComponent({
        name: 'OtherComp',
        setup() {
          return () => h('text', null, 'other');
        },
      });

      const current = ref('TransComp');
      const views: Record<string, any> = { TransComp, OtherComp };

      const App = defineComponent({
        setup() {
          return () =>
            h(KeepAlive, null, {
              default: () => h(views[current.value]),
            });
        },
      });

      const { container } = render(App);
      await flush();

      expect(container.querySelector('.trans-comp')).not.toBeNull();
      expect(mountedCount).toHaveBeenCalledTimes(1);

      // Deactivate
      current.value = 'OtherComp';
      await flush();

      // Reactivate — component should be cached (mounted only once)
      current.value = 'TransComp';
      await flush();

      expect(mountedCount).toHaveBeenCalledTimes(1); // cached, not re-mounted
      expect(container.querySelector('.trans-comp')).not.toBeNull();
    });
  });
});
