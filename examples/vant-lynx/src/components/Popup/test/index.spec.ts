import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Popup from '../index.vue';

describe('Popup', () => {
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true }, {
            default: () => h('text', null, 'Popup Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: false }, {
            default: () => h('text', null, 'Popup Content'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasPopupContent = Array.from(textEls).some(
      (t) => t.textContent === 'Popup Content',
    );
    expect(hasPopupContent).toBe(false);
  });
});
