import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Divider from '../index.vue';

describe('Divider', () => {
  it('should render divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render divider with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, null, {
            default: () => h('text', null, 'Text'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render dashed divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { dashed: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
