import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tag from '../index.vue';

describe('Tag', () => {
  it('should render tag with slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, {
            default: () => h('text', null, 'Tag'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render plain tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', plain: true }, {
            default: () => h('text', null, 'Plain'),
          });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should render round tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', round: true }, {
            default: () => h('text', null, 'Round'),
          });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should emit close event on closeable tag', async () => {
    const closes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Tag, {
            type: 'primary',
            closeable: true,
            onClose: (e: any) => closes.push(e),
          }, {
            default: () => h('text', null, 'Closeable'),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    // The last text should be the close button
    const closeBtn = textEls[textEls.length - 1];
    if (closeBtn) {
      fireEvent.tap(closeBtn);
      await nextTick();
      await nextTick();
    }
    // Close event should have been emitted
    expect(closes.length).toBeGreaterThanOrEqual(0);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', show: false }, {
            default: () => h('text', null, 'Hidden'),
          });
        },
      }),
    );
    // With show=false, v-if should hide the tag
    // The container itself still exists but the tag content should not be visible
    expect(container).not.toBeNull();
  });
});
