import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import IndexBar from '../../IndexBar/index.vue';
import IndexAnchor from '../index.vue';

describe('IndexAnchor', () => {
  it('should render anchor with index text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }, {
              default: () => h('text', {}, 'Content A'),
            }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });
});
