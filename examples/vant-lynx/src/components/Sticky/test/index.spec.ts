import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Sticky from '../index.vue';

describe('Sticky', () => {
  it('should render sticky wrapper', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, {}, {
            default: () => h('text', {}, 'Sticky Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom offset', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, { offsetTop: 50, zIndex: 200 }, {
            default: () => h('text', {}, 'Sticky Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with bottom position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sticky, { position: 'bottom', offsetBottom: 30 }, {
            default: () => h('text', {}, 'Bottom Sticky'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
