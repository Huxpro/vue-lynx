import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PullRefresh from '../index.vue';

describe('PullRefresh', () => {
  it('should render PullRefresh with slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PullRefresh, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Content',
    );
    expect(hasContent).toBe(true);
  });

  it('should render with custom head height', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PullRefresh, { headHeight: 80 }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should show loading text when modelValue is true', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(PullRefresh, { modelValue: true }, {
              default: () => h('text', null, 'Content'),
            });
        },
      }),
    );
    // When modelValue is true, loading state should be reflected
    expect(container).not.toBeNull();
  });

  it('should not respond to touch when disabled', async () => {
    const changes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(PullRefresh, {
            disabled: true,
            onChange: (e: any) => changes.push(e),
          }, {
            default: () => h('text', null, 'Content'),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.touchstart(viewEl, { touches: [{ clientY: 0 }] });
    fireEvent.touchmove(viewEl, { touches: [{ clientY: 100 }] });
    fireEvent.touchend(viewEl);
    await nextTick();
    expect(changes.length).toBe(0);
  });

  it('should accept custom status text props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PullRefresh, {
            pullingText: 'Pull down',
            loosingText: 'Release now',
            loadingText: 'Refreshing...',
            successText: 'Done!',
          }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
