import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Radio from '../index.vue';

describe('Radio', () => {
  it('should render radio', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1' }, {
            default: () => h('text', null, 'Option 1'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
