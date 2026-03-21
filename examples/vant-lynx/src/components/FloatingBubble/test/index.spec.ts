import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import FloatingBubble from '../index.vue';

describe('FloatingBubble', () => {
  it('should render FloatingBubble', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(FloatingBubble);
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
