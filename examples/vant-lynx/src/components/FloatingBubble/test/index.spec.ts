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

  it('should accept all Vant-compatible props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(FloatingBubble, {
            icon: 'chat',
            axis: 'xy',
            magnetic: 'x',
            offset: { x: 100, y: 200 },
            gap: 16,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should support gap as object { x, y }', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(FloatingBubble, {
            gap: { x: 16, y: 32 },
            axis: 'xy',
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render default slot for custom content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            FloatingBubble,
            { axis: 'xy' },
            {
              default: () => h('text', 'Custom'),
            },
          );
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
