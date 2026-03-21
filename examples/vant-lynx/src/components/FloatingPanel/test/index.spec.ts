import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import FloatingPanel from '../index.vue';

describe('FloatingPanel', () => {
  it('should render FloatingPanel', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(FloatingPanel);
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
