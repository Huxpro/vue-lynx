import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ActionBarButton from '../index.vue';

describe('ActionBarButton', () => {
  it('should render button with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'danger', text: 'Buy Now' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render disabled button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'primary', text: 'Submit', disabled: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render loading button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'primary', text: 'Submit', loading: true });
        },
      }),
    );
    // Loading state uses Loading component (view-based spinner), not text
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
