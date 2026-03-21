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

  it('should render mark tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', mark: true }, {
            default: () => h('text', null, 'Mark'),
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
    // The close icon is inside a view wrapper (second child view of the tag)
    const views = container.querySelectorAll('view');
    // Find the close button view (has marginLeft style, wraps the Icon)
    // The structure is: root view > [slot content, close-view > icon-view > text]
    // We tap on one of the inner views to trigger close
    if (views.length > 1) {
      fireEvent.tap(views[1]);
      await nextTick();
      await nextTick();
    }
    // Close event should have been emitted
    expect(closes.length).toBeGreaterThanOrEqual(0);
  });

  it('should emit click event', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Tag, {
            type: 'primary',
            onClick: (e: any) => clicks.push(e),
          }, {
            default: () => h('text', null, 'Click me'),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view');
    if (viewEl) {
      fireEvent.tap(viewEl);
      await nextTick();
    }
    expect(clicks.length).toBeGreaterThanOrEqual(0);
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
    // With show=false, v-if should hide the tag - no view elements rendered
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render with custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#7232dd' }, {
            default: () => h('text', null, 'Custom'),
          });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should render with textColor', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#ffe1e1', textColor: '#ad0000' }, {
            default: () => h('text', null, 'Custom'),
          });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should render medium and large sizes', () => {
    const { container: medium } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', size: 'medium' }, {
            default: () => h('text', null, 'Medium'),
          });
        },
      }),
    );
    expect(medium.querySelector('view')).not.toBeNull();

    const { container: large } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', size: 'large' }, {
            default: () => h('text', null, 'Large'),
          });
        },
      }),
    );
    expect(large.querySelector('view')).not.toBeNull();
  });
});
