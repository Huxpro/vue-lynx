import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Col from '../index.vue';
import Row from '../../Row/index.vue';

describe('Col', () => {
  it('should render Col with correct span width', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () =>
              h(Col, { span: 8 }, {
                default: () => h('text', null, 'span: 8'),
              }),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const colView = views[1];
    expect(colView).toBeTruthy();
    const style = colView!.getAttribute('style') || '';
    expect(style).toContain('width: 33.333');
  });

  it('should render gutter correctly with multiple cols', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: '24' }, {
            default: () => [
              h(Col, { span: 24, key: 1 }, {
                default: () => h('text', null, '24'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 3 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 8, key: 4 }, {
                default: () => h('text', null, '8'),
              }),
              h(Col, { span: 8, key: 5 }, {
                default: () => h('text', null, '8'),
              }),
              h(Col, { span: 8, key: 6 }, {
                default: () => h('text', null, '8'),
              }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    // Row has negative margins
    const rowView = views[0];
    const rowStyle = rowView!.getAttribute('style') || '';
    expect(rowStyle).toContain('margin-left: -12px');
    expect(rowStyle).toContain('margin-right: -12px');
    // Multiple cols rendered
    expect(views.length).toBeGreaterThanOrEqual(7);
  });

  it('should render vertical space when gutter is an array and provide the second parameter', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: [0, 20] }, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 3 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 4 }, {
                default: () => h('text', null, '12'),
              }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const col1Style = views[1]?.getAttribute('style') || '';
    const col2Style = views[2]?.getAttribute('style') || '';
    const col3Style = views[3]?.getAttribute('style') || '';
    const col4Style = views[4]?.getAttribute('style') || '';
    // First row (cols 1,2): should have marginBottom
    expect(col1Style).toContain('margin-bottom: 20px');
    expect(col2Style).toContain('margin-bottom: 20px');
    // Last row (cols 3,4): should NOT have marginBottom
    expect(col3Style).not.toContain('margin-bottom');
    expect(col4Style).not.toContain('margin-bottom');
  });

  it('should not render vertical space when gutter is an array and provide the second parameter as negative number', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: [16, -16] }, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 3 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 4 }, {
                default: () => h('text', null, '12'),
              }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    for (let i = 1; i <= 4; i++) {
      const style = views[i]?.getAttribute('style') || '';
      expect(style).not.toContain('margin-bottom');
    }
  });

  it('should not render space when gutter is an empty array', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: [] }, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, '12'),
              }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const col1Style = views[1]?.getAttribute('style') || '';
    expect(col1Style).not.toContain('padding-right');
    expect(col1Style).not.toContain('margin-bottom');
  });

  it('should not render vertical space when gutter is an array and provide the second parameter as invalid number', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: [0, 'invalid'] }, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, '12'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, '12'),
              }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const col1Style = views[1]?.getAttribute('style') || '';
    expect(col1Style).not.toContain('margin-bottom');
  });

  it('should render Col with offset', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () =>
              h(Col, { span: 12, offset: 12 }, {
                default: () => h('text', null, 'offset: 12'),
              }),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const colView = views[1];
    const style = colView!.getAttribute('style') || '';
    expect(style).toContain('width: 50%');
    expect(style).toContain('margin-left: 50%');
  });

  it('should render Col without parent Row', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Col, { span: 12 }, {
            default: () => h('text', null, 'standalone'),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(1);
    const style = views[0]?.getAttribute('style') || '';
    expect(style).toContain('width: 50%');
  });
});
