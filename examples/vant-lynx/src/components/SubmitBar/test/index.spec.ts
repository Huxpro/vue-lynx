import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import SubmitBar from '../index.vue';

describe('SubmitBar', () => {
  it('should render with price', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasPrice = Array.from(textEls).some((t) =>
      t.textContent?.includes('30'),
    );
    expect(hasPrice).toBe(true);
  });

  it('should render button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, buttonText: 'Submit Order' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasButton = Array.from(textEls).some((t) =>
      t.textContent?.trim() === 'Submit Order',
    );
    expect(hasButton).toBe(true);
  });

  it('should render with tip', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, tip: 'Free shipping on orders over $50' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTip = Array.from(textEls).some((t) =>
      t.textContent === 'Free shipping on orders over $50',
    );
    expect(hasTip).toBe(true);
  });

  it('should render disabled state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, buttonText: 'Pay', disabled: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 2000, label: 'Total:' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasLabel = Array.from(textEls).some((t) => t.textContent === 'Total:');
    expect(hasLabel).toBe(true);
  });
});
