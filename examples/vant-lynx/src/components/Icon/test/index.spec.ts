import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Icon from '../index.vue';

describe('Icon', () => {
  it('should render icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render dot badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'chat', dot: true });
        },
      }),
    );
    // Should have the icon text and a dot view
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render number badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'chat', badge: '5' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(1);
  });

  it('should apply custom color and size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'star', size: 32, color: '#1989fa' });
        },
      }),
    );
    // Icon now wraps in Badge - text is nested deeper
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
    const iconText = Array.from(textEls).find((t) => t.textContent === '\u2605');
    expect(iconText).toBeTruthy();
  });
});
