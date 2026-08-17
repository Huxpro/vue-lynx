import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Space from '../index.vue';

describe('Space', () => {
  it('should render space with default 8px margin', () => {
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
    const items = container.querySelectorAll('.van-space-item');
    expect(items.length).toBe(3);
    expect(items[0]?.getAttribute('style')).toContain('margin-right: 8px');
    expect(items[1]?.getAttribute('style')).toContain('margin-right: 8px');
    expect(items[2]?.getAttribute('style') || '').not.toContain('margin-right');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--vertical');

    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style')).toContain('margin-bottom: 8px');
    expect(items[1]?.getAttribute('style')).toContain('margin-bottom: 8px');
    expect(items[2]?.getAttribute('style') || '').not.toContain('margin-bottom');
  });

  it('should render size 20px', () => {
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
    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style')).toContain('margin-right: 20px');
    expect(items[1]?.getAttribute('style')).toContain('margin-right: 20px');
    expect(items[2]?.getAttribute('style') || '').not.toContain('margin-right');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--align-start');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--wrap');
  });

  // Additional tests beyond Vant's 5 core tests:

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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--align-end');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--align-center');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--fill');
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
    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style')).toContain('margin-right: 20px');
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
    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style')).toContain('margin-right: 16px');
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
    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style') || '').not.toContain('margin-right');
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--align-center');
  });

  it('should have horizontal direction class by default', () => {
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
    const space = container.querySelector('.van-space');
    expect(space?.getAttribute('class')).toContain('van-space--horizontal');
  });

  it('should add margin-bottom to wrap items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { wrap: true }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-space-item');
    expect(items[0]?.getAttribute('style')).toContain('margin-right: 8px');
    expect(items[0]?.getAttribute('style')).toContain('margin-bottom: 8px');
  });
});
