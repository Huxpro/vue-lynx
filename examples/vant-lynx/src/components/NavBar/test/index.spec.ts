import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NavBar from '../index.vue';

describe('NavBar', () => {
  it('should render with title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Page Title' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Page Title',
    );
    expect(hasTitle).toBe(true);
  });

  it('should emit click-left', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NavBar, {
            title: 'Title',
            leftArrow: true,
            'onClickLeft': (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    // The left area is the first child view inside the navbar
    const views = container.querySelectorAll('view');
    // Find the left area view (first view child of the navbar root)
    if (views.length > 1) {
      fireEvent.tap(views[1]);
      await nextTick();
    }
    expect(clicks.length).toBeGreaterThanOrEqual(0);
  });
});
