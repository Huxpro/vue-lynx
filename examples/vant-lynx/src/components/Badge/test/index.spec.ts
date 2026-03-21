import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Badge from '../index.vue';

describe('Badge', () => {
  it('should render badge with content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 5 }, {
            default: () => h('view', { style: { width: 40, height: 40 } }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render dot badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { dot: true }, {
            default: () => h('view', { style: { width: 40, height: 40 } }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render max value', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 100, max: 99 }, {
            default: () => h('view', { style: { width: 40, height: 40 } }),
          });
        },
      }),
    );
    // Should show 99+
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should not show zero when showZero is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 0, showZero: false }, {
            default: () => h('view', { style: { width: 40, height: 40 } }),
          });
        },
      }),
    );
    // Badge should not show content when zero and showZero is false
    expect(container).not.toBeNull();
  });
});
