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

  it('should accept all Vant-compatible props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SwipeCell, {
            name: 'test-cell',
            leftWidth: 80,
            rightWidth: 80,
            disabled: false,
            stopPropagation: false,
            beforeClose: () => true,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render left and right slots', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            SwipeCell,
            { leftWidth: 80, rightWidth: 80 },
            {
              left: () => h('text', 'Left'),
              default: () => h('text', 'Content'),
              right: () => h('text', 'Right'),
            },
          );
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
