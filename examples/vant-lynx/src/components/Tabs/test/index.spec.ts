import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabs from '../index.vue';
import Tab from '../../Tab/index.vue';

describe('Tabs', () => {
  it('should render tabs container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { modelValue: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
