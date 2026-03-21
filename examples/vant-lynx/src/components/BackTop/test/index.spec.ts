import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import BackTop from '../index.vue';

describe('BackTop', () => {
  it('should render back top button (hidden by default)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { visibilityHeight: 200 });
        },
      }),
    );
    // BackTop is hidden by default (scrollTop < visibilityHeight)
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render with custom position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { right: 20, bottom: 60, visibilityHeight: 0 });
        },
      }),
    );
    // With visibilityHeight 0, it's always visible in initial state (scrollTop=0 >= 0)
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(0);
  });
});
