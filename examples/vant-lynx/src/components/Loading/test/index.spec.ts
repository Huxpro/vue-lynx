import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Loading from '../index.vue';

describe('Loading', () => {
  it('should render circular loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { type: 'circular' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render spinner loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { type: 'spinner' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render vertical loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { vertical: true });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should apply custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { color: '#1989fa' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
