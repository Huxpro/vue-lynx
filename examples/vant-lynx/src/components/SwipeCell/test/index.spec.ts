import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import SwipeCell from '../index.vue';

describe('SwipeCell', () => {
  it('should render SwipeCell', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SwipeCell);
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
