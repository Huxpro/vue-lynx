import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Collapse from '../index.vue';
import CollapseItem from '../../CollapseItem/index.vue';

describe('Collapse', () => {
  it('should render collapse container with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Collapse, { modelValue: [1] }, {
            default: () => [
              h(CollapseItem, { name: 1, title: 'Section 1' }, { default: () => 'Content 1' }),
              h(CollapseItem, { name: 2, title: 'Section 2' }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });
});
