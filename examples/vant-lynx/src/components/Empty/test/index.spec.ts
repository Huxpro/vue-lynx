import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Empty from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

describe('Empty', () => {
  // Vant test 1: should render image slot correctly
  it('should render image slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, null, {
            image: () => h('text', null, 'Custom Image'),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom Image');
  });

  // Vant test 2: should render description slot correctly
  it('should render description slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, null, {
            description: () => h('text', null, 'Custom description'),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom description');
  });

  // Vant test 3: should render bottom slot correctly
  it('should render bottom slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, null, {
            default: () => h('text', null, 'Custom bottom'),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom bottom');
  });

  // Vant test 4: should render preset images for each type
  it('should render preset images for each type', () => {
    for (const type of ['default', 'error', 'network', 'search']) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Empty, { image: type });
          },
        }),
      );
      const texts = getTexts(container);
      expect(texts.length).toBeGreaterThan(0);
    }
  });

  // Vant test 5: should change image size when using image-size prop
  it('should change image size when using image-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { imageSize: 50 });
        },
      }),
    );
    const imageView = container.querySelector('.van-empty__image');
    expect(imageView).toBeTruthy();
    const style = imageView?.getAttribute('style') || '';
    expect(style).toContain('50px');
  });

  // Vant test 5b: string image size
  it('should support string image-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { imageSize: '1vw' });
        },
      }),
    );
    const imageView = container.querySelector('.van-empty__image');
    const style = imageView?.getAttribute('style') || '';
    expect(style).toContain('1vw');
  });

  // Vant test 6: should allow to set image width and height separately by image-size prop
  it('should allow to set image width and height separately by image-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { imageSize: [20, 10] });
        },
      }),
    );
    const imageView = container.querySelector('.van-empty__image');
    const style = imageView?.getAttribute('style') || '';
    expect(style).toContain('20px');
    expect(style).toContain('10px');
  });

  // Additional: should render description prop
  it('should render description prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { description: 'Nothing here' });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Nothing here');
  });

  // Additional: should use BEM class names
  it('should use BEM class names', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { description: 'test' }, {
            default: () => h('text', null, 'bottom'),
          });
        },
      }),
    );
    expect(container.querySelector('.van-empty')).toBeTruthy();
    expect(container.querySelector('.van-empty__image')).toBeTruthy();
    expect(container.querySelector('.van-empty__description')).toBeTruthy();
    expect(container.querySelector('.van-empty__bottom')).toBeTruthy();
  });

  // Additional: should render custom image URL
  it('should render custom image URL via image element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { image: 'https://example.com/image.png' });
        },
      }),
    );
    const images = container.querySelectorAll('image');
    expect(images.length).toBe(1);
    const src = images[0].getAttribute('src');
    expect(src).toBe('https://example.com/image.png');
  });

  // Additional: should not render bottom when no default slot
  it('should not render bottom area when no default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty, { description: 'test' });
        },
      }),
    );
    expect(container.querySelector('.van-empty__bottom')).toBeFalsy();
  });

  // Additional: should not render description when neither prop nor slot provided
  it('should not render description when no prop or slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty);
        },
      }),
    );
    expect(container.querySelector('.van-empty__description')).toBeFalsy();
  });
});
