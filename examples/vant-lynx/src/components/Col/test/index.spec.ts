import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Col from '../index.vue';
import Row from '../../Row/index.vue';

describe('Col', () => {
  it('should render col with correct span inside row', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Row, null, {
            default: () =>
              h(Col, { span: 12 }, {
                default: () => h('text', null, 'Column'),
              }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render multiple cols inside row', () => {
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
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(3);
  });
});
