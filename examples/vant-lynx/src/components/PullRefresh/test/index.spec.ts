import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import PullRefresh from '../index.vue';

describe('PullRefresh', () => {
  it('should render PullRefresh', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PullRefresh);
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
