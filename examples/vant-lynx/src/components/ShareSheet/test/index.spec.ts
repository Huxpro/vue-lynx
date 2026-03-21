import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ShareSheet from '../index.vue';

describe('ShareSheet', () => {
  it('should render ShareSheet', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ShareSheet);
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
