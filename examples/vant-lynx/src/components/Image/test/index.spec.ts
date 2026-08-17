import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import VanImage from '../index.vue';

describe('Image', () => {
  it('should render image with src', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: 100, height: 100 });
        },
      }),
    );
    const imageEl = container.querySelector('image');
    expect(imageEl).not.toBeNull();
  });

  it('should render round image', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: 100, height: 100, round: true });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should render without src', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { width: 100, height: 100 });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });
});
