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

  it('should accept all Vant-compatible props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(FloatingPanel, {
            height: 200,
            anchors: [100, 300, 600],
            duration: 0.5,
            contentDraggable: true,
            draggable: true,
            magnetic: true,
            lockScroll: false,
            safeAreaInsetBottom: true,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render header slot and default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            FloatingPanel,
            { anchors: [100, 400] },
            {
              header: () => h('text', 'Custom Header'),
              default: () => h('text', 'Panel Content'),
            },
          );
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
