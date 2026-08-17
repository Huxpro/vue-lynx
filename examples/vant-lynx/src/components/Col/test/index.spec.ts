import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Col from '../index.vue';
import Row from '../../Row/index.vue';

describe('Col', () => {
  it('should render with van-col class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Col, { span: 8 }, {
            default: () => h('text', null, 'span: 8'),
          });
        },
      }),
    );
    const col = container.querySelector('.van-col');
    expect(col).not.toBeNull();
  });

  it('should add span class for span prop', () => {
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
    const col = container.querySelector('.van-col');
    expect(col!.getAttribute('class')).toContain('van-col--8');
  });

  it('should add offset class for offset prop', async () => {
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
    const col = container.querySelector('.van-col');
    expect(col!.getAttribute('class')).toContain('van-col--12');
    expect(col!.getAttribute('class')).toContain('van-col--offset-12');
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
    const cols = container.querySelectorAll('.van-col');
    expect(cols.length).toBe(6);
  });

  it('should render vertical space when gutter is an array', async () => {
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
    const cols = container.querySelectorAll('.van-col');
    const col1Style = cols[0]?.getAttribute('style') || '';
    const col2Style = cols[1]?.getAttribute('style') || '';
    const col3Style = cols[2]?.getAttribute('style') || '';
    const col4Style = cols[3]?.getAttribute('style') || '';
    // First row (cols 1,2): should have marginBottom
    expect(col1Style).toContain('margin-bottom: 20px');
    expect(col2Style).toContain('margin-bottom: 20px');
    // Last row (cols 3,4): should NOT have marginBottom
    expect(col3Style).not.toContain('margin-bottom');
    expect(col4Style).not.toContain('margin-bottom');
  });

  it('should not render vertical space when second gutter param is negative', async () => {
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
            ],
          });
        },
      }),
    );
    await nextTick();
    const cols = container.querySelectorAll('.van-col');
    for (const col of Array.from(cols)) {
      const style = col.getAttribute('style') || '';
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
    const col = container.querySelectorAll('.van-col')[0];
    const style = col?.getAttribute('style') || '';
    expect(style).not.toContain('padding-right');
    expect(style).not.toContain('margin-bottom');
  });

  it('should not render vertical space when second gutter param is invalid', async () => {
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
    const col = container.querySelectorAll('.van-col')[0];
    const style = col?.getAttribute('style') || '';
    expect(style).not.toContain('margin-bottom');
  });

  it('should render Col without parent Row', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Col, { span: 12 }, {
            default: () => h('text', null, 'standalone'),
          });
        },
      }),
    );
    const col = container.querySelector('.van-col');
    expect(col).not.toBeNull();
    expect(col!.getAttribute('class')).toContain('van-col--12');
  });

  it('should not have span class when span is 0', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Col, null, {
            default: () => h('text', null, 'no span'),
          });
        },
      }),
    );
    const col = container.querySelector('.van-col');
    expect(col!.getAttribute('class')).toBe('van-col');
  });

  it('should apply gutter padding to Col children', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, { gutter: 20 }, {
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
    await nextTick();
    const cols = container.querySelectorAll('.van-col');
    // First Col should have right padding only
    const firstStyle = cols[0]?.getAttribute('style') || '';
    expect(firstStyle).toContain('padding-right');
    expect(firstStyle).not.toContain('padding-left');
    // Last Col should have left padding only
    const lastStyle = cols[2]?.getAttribute('style') || '';
    expect(lastStyle).toContain('padding-left');
  });
});
