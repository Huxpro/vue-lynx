import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Space from '../index.vue';

describe('Space', () => {
  it('should render horizontal space with default 8px margin', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, null, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
              h('view', { key: 3 }, [h('text', null, 'C')]),
            ],
          });
        },
      }),
    );
    // Container > 3 item wrappers, each wrapping a view
    const views = container.querySelectorAll('view');
    // views[0] = container, views[1] = item-0, views[2] = child-A, views[3] = item-1, etc.
    const item0Style = views[1]?.getAttribute('style') || '';
    const item1Style = views[3]?.getAttribute('style') || '';
    const item2Style = views[5]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-right: 8px');
    expect(item1Style).toContain('margin-right: 8px');
    // Last item should NOT have margin-right
    expect(item2Style).not.toContain('margin-right');
  });

  it('should render vertical space', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { direction: 'vertical', fill: true }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
              h('view', { key: 3 }, [h('text', null, 'C')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('column');

    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    const item1Style = views[3]?.getAttribute('style') || '';
    const item2Style = views[5]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-bottom: 8px');
    expect(item1Style).toContain('margin-bottom: 8px');
    expect(item2Style).not.toContain('margin-bottom');
  });

  it('should render with custom size 20px', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { size: '20px' }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
              h('view', { key: 3 }, [h('text', null, 'C')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    const item1Style = views[3]?.getAttribute('style') || '';
    const item2Style = views[5]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-right: 20px');
    expect(item1Style).toContain('margin-right: 20px');
    expect(item2Style).not.toContain('margin-right');
  });

  it('should render with numeric size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { size: 20 }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-right: 20px');
  });

  it('should render align start', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { align: 'start' }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('flex-start');
  });

  it('should render align end', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { align: 'end' }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('flex-end');
  });

  it('should render align center', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { align: 'center' }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('center');
  });

  it('should render wrap', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { wrap: true }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
              h('view', { key: 3 }, [h('text', null, 'C')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('wrap');

    // Items should have both margin-right and margin-bottom when wrapping
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-right: 8px');
    expect(item0Style).toContain('margin-bottom: 8px');
  });

  it('should render fill', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { fill: true }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('100%');

    // Items should have flex: 1
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    expect(item0Style).toContain('flex: 1');
  });

  it('should render with array size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { size: [16, 24] }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    expect(item0Style).toContain('margin-right: 16px');
  });

  it('should not add margin to last item in horizontal mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, null, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'Only')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const item0Style = views[1]?.getAttribute('style') || '';
    expect(item0Style).not.toContain('margin-right');
  });

  it('should default align to center for horizontal', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, null, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
            ],
          });
        },
      }),
    );
    const containerView = container.querySelectorAll('view')[0];
    const containerStyle = containerView?.getAttribute('style') || '';
    expect(containerStyle).toContain('center');
  });
});
