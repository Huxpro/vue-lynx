import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Grid from '../index.vue';
import GridItem from '../../GridItem/index.vue';

describe('Grid', () => {
  it('should render grid container with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { columnNum: 4 }, {
            default: () => [
              h(GridItem, { icon: '\u2605', text: 'Item 1' }),
              h(GridItem, { icon: '\u2606', text: 'Item 2' }),
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
