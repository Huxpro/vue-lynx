import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Swipe from '../index.vue';

describe('Swipe', () => {
  it('should render swipe container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Swipe, { height: 150 }, {
            default: () => [
              h('view', { key: 1 }, [h('text', {}, 'Slide 1')]),
              h('view', { key: 2 }, [h('text', {}, 'Slide 2')]),
              h('view', { key: 3 }, [h('text', {}, 'Slide 3')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with initial swipe index', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Swipe, { initialSwipe: 1, height: 200 }, {
            default: () => [
              h('view', { key: 1 }, [h('text', {}, 'Slide 1')]),
              h('view', { key: 2 }, [h('text', {}, 'Slide 2')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render without indicators when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Swipe, { showIndicators: false, height: 150 }, {
            default: () => [
              h('view', { key: 1 }, [h('text', {}, 'Slide 1')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
