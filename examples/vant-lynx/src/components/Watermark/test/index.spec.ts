import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Watermark from '../index.vue';

describe('Watermark', () => {
  it('should render watermark with text content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Watermark',
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom properties', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Custom',
            width: 120,
            height: 80,
            rotate: -30,
            opacity: 0.2,
            fontColor: '#999',
            fontSize: 16,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with fullPage false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Local',
            fullPage: false,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
