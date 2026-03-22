import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Row from '../index.vue';
import Col from '../../Col/index.vue';

describe('Row', () => {
  it('should render with van-row class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView).not.toBeNull();
  });

  it('should add "van-row--nowrap" class when wrap prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { wrap: false }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--nowrap');
  });

  it('should not have nowrap class when wrap is true (default)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).not.toContain('van-row--nowrap');
  });

  it('should add justify-center class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'center' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--justify-center');
  });

  it('should add justify-end class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'end' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--justify-end');
  });

  it('should add justify-space-between class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'space-between' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--justify-space-between');
  });

  it('should add justify-space-around class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { justify: 'space-around' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--justify-space-around');
  });

  it('should not add justify class when justify is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).not.toContain('justify');
  });

  it('should add align-center class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { align: 'center' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--align-center');
  });

  it('should add align-bottom class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { align: 'bottom' }, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).toContain('van-row--align-bottom');
  });

  it('should not add align class when align is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    expect(rowView!.getAttribute('class')).not.toContain('align');
  });

  it('should render Col children', () => {
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
    const cols = container.querySelectorAll('.van-col');
    expect(cols.length).toBe(3);
  });

  it('should not have inline styles when no gutter', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => h('text', null, 'Content'),
          });
        },
      }),
    );
    const rowView = container.querySelector('.van-row');
    const style = rowView!.getAttribute('style') || '';
    expect(style).not.toContain('margin-left');
    expect(style).not.toContain('margin-right');
  });

  it('should support string gutter value', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: '20' }, {
            default: () =>
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, 'A'),
              }),
          });
        },
      }),
    );
    // Gutter is applied to Col children, not the Row itself
    const cols = container.querySelectorAll('.van-col');
    expect(cols.length).toBe(1);
  });
});
