import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import IndexBar from '../index.vue';
import IndexAnchor from '../../IndexAnchor/index.vue';

describe('IndexBar', () => {
  it('should render index bar with anchors', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, {}, {
            default: () => [
              h(IndexAnchor, { index: 'A' }, { default: () => h('text', {}, 'Item A') }),
              h(IndexAnchor, { index: 'B' }, { default: () => h('text', {}, 'Item B') }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom index list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(3);
  });
});
