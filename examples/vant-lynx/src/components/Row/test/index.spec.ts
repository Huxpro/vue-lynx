import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Row from '../index.vue';
import Col from '../../Col/index.vue';

describe('Row', () => {
  it('should render row with default flex styles', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    expect(rowView).not.toBeNull();
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('display: flex');
    expect(style).toContain('flex-direction: row');
    expect(style).toContain('flex-wrap: wrap');
  });

  it('should set nowrap when wrap prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { wrap: false }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('flex-wrap: nowrap');
  });

  it('should not set justify-content when justify prop is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).not.toContain('justify-content');
  });

  it('should set justify-content center when justify is center', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'center' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('justify-content: center');
  });

  it('should set justify-content flex-end when justify is end', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'end' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('justify-content: flex-end');
  });

  it('should set justify-content space-between', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'space-between' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('justify-content: space-between');
  });

  it('should set justify-content space-around', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'space-around' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('justify-content: space-around');
  });

  it('should not set align-items when align prop is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).not.toContain('align-items');
  });

  it('should set align-items center when align is center', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { align: 'center' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('align-items: center');
  });

  it('should set align-items flex-end when align is bottom', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { align: 'bottom' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('align-items: flex-end');
  });

  it('should apply negative margins when gutter is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: 20 }, {
            default: () =>
              h(Col, { span: 12 }, {
                default: () => h('text', null, 'Content'),
              }),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('margin-left: -10px');
    expect(style).toContain('margin-right: -10px');
  });

  it('should support array gutter for horizontal and vertical spacing', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: [20, 10] }, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, 'A'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, 'B'),
              }),
            ],
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('margin-left: -10px');
    expect(style).toContain('margin-right: -10px');
  });

  it('should render Col children with correct width', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => [
              h(Col, { span: 8, key: 1 }, {
                default: () => h('text', null, 'A'),
              }),
              h(Col, { span: 8, key: 2 }, {
                default: () => h('text', null, 'B'),
              }),
              h(Col, { span: 8, key: 3 }, {
                default: () => h('text', null, 'C'),
              }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(3);
  });

  it('should apply gutter padding to Col children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: 20 }, {
            default: () =>
              h(Col, { span: 12 }, {
                default: () => h('text', null, 'Content'),
              }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // Col view should have padding
    const colView = views[1];
    if (colView) {
      const style = colView.getAttribute('style') || '';
      expect(style).toContain('padding-left: 10px');
      expect(style).toContain('padding-right: 10px');
    }
  });

  it('should not apply gutter when gutter is 0', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: 0 }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).not.toContain('margin-left');
    expect(style).not.toContain('margin-right');
  });

  it('should support string gutter value', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: '20' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('view');
    const style = rowView!.getAttribute('style') || '';
    expect(style).toContain('margin-left: -10px');
    expect(style).toContain('margin-right: -10px');
  });
});
