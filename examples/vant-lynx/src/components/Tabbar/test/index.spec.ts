import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabbar from '../index.vue';
import TabbarItem from '../../TabbarItem/index.vue';

describe('Tabbar', () => {
  it('should render tabbar with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 'home' }, {
            default: () => [
              h(TabbarItem, { name: 'home', icon: '\u2302' }, { default: () => 'Home' }),
              h(TabbarItem, { name: 'user', icon: '\u263A' }, { default: () => 'User' }),
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
