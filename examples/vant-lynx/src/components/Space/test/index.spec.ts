import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Space from '../index.vue';

describe('Space', () => {
  it('should render horizontal space', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, null, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render vertical space', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { direction: 'vertical' }, {
            default: () => [
              h('view', { key: 1 }, [h('text', null, 'A')]),
              h('view', { key: 2 }, [h('text', null, 'B')]),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render with custom size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Space, { size: 20 }, {
            default: () => [
              h('view', { key: 1 }),
              h('view', { key: 2 }),
            ],
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
