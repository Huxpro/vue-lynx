import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
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

  // Vant test 4: should render preset image types
  it('should render preset images for each type', () => {
    for (const type of ['default', 'error', 'network', 'search']) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Empty, { image: type });
          },
        }),
      );
      // Each preset type should render a text element with an emoji
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
    // Find the image container view (second view level)
    const rootView = container.querySelector('view');
    const imageView = rootView?.querySelector('view');
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
    const rootView = container.querySelector('view');
    const imageView = rootView?.querySelector('view');
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
    const rootView = container.querySelector('view');
    const imageView = rootView?.querySelector('view');
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

  // Additional: should render with default state
  it('should render with default state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Empty);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
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
    // Should only have image container view, no bottom view
    const rootView = container.querySelector('view');
    const childViews = rootView
      ? Array.from(rootView.children).filter(
          (el: any) => el.tagName?.toLowerCase() === 'view',
        )
      : [];
    // Only the image container view should be present
    expect(childViews.length).toBe(1);
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
    // No text with typical description content should exist
    const texts = getTexts(container);
    const hasDescription = texts.some(
      (t) =>
        t.length > 5 &&
        !t.includes('\u{1F4ED}') &&
        !t.includes('\u{26A0}') &&
        !t.includes('\u{1F310}') &&
        !t.includes('\u{1F50D}'),
    );
    expect(hasDescription).toBe(false);
  });
});
