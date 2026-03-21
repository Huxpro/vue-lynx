import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Overlay from '../index.vue';

describe('Overlay', () => {
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: false });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).toBeNull();
  });

  it('should emit click on tap', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Overlay, {
            show: true,
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(clicks.length).toBe(1);
  });
});
