import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import SubmitBar from '../index.vue';

describe('SubmitBar', () => {
  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render price', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 3050 });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('¥30');
    expect(textContents).toContain('.50');
  });

  it('should render label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, label: 'Total:' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Total:');
  });

  it('should render button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, buttonText: 'Pay Now' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent?.trim());
    expect(textContents).toContain('Pay Now');
  });

  it('should render tip text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, tip: 'Free shipping' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Free shipping');
  });

  it('should show loading state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SubmitBar, { price: 1000, loading: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent?.trim());
    expect(textContents).toContain('...');
  });
});
