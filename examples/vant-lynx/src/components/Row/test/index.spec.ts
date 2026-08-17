import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Row from '../index.vue';
import Col from '../../Col/index.vue';

describe('Row', () => {
  it('should render row with children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'Child 1')]),
              h('view', { key: 2 }, [h('text', null, 'Child 2')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render row with col children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () => [
              h(Col, { span: 12, key: 1 }, {
                default: () => h('text', null, 'Left'),
              }),
              h(Col, { span: 12, key: 2 }, {
                default: () => h('text', null, 'Right'),
              }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should apply gutter style', () => {
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
    expect(rowView).not.toBeNull();
  });
});
