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
    expect(imageEl!.getAttribute('src')).toBe('https://example.com/img.jpg');
  });

  it('should render loading placeholder when src is set (before load)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: 100, height: 100 });
        },
      }),
    );
    // Image should exist, and loading placeholder should also exist (has Icon inside)
    expect(container.querySelector('image')).not.toBeNull();
    const views = container.querySelectorAll('view');
    // Root view + loading placeholder view = at least 2
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('should render loading placeholder when src is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { width: 100, height: 100 });
        },
      }),
    );
    // No image element when src is not set
    expect(container.querySelector('image')).toBeNull();
    // Loading placeholder should be shown
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('should not render loading placeholder when showLoading is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            width: 100,
            height: 100,
            showLoading: false,
          });
        },
      }),
    );
    // Image exists but no loading placeholder
    expect(container.querySelector('image')).not.toBeNull();
    // Only the root view (no extra placeholder views for loading)
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(1);
  });

  it('should render round image with border-radius', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            width: 100,
            height: 100,
            round: true,
          });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('999px');
  });

  it('should change border radius when using radius prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            width: 100,
            height: 100,
            radius: 3,
          });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('3px');
    expect(style).toContain('overflow');
  });

  it('should apply width and height from props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: 200, height: 150 });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('200px');
    expect(style).toContain('150px');
  });

  it('should apply string width and height from props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: '10rem', height: '10rem' });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('10rem');
  });

  it('should apply fit prop to image style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            width: 100,
            height: 100,
            fit: 'cover',
          });
        },
      }),
    );
    const imageEl = container.querySelector('image');
    const style = imageEl!.getAttribute('style') || '';
    expect(style).toContain('cover');
  });

  it('should render default slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            VanImage,
            { src: 'https://example.com/img.jpg', width: 100, height: 100 },
            { default: () => h('text', {}, 'Custom Default') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find((t) => t.textContent === 'Custom Default');
    expect(slotText).toBeTruthy();
  });

  it('should render custom loading slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            VanImage,
            { src: 'https://example.com/img.jpg', width: 100, height: 100 },
            { loading: () => h('text', {}, 'Custom Loading') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find((t) => t.textContent === 'Custom Loading');
    expect(slotText).toBeTruthy();
  });

  it('should render error icon with errorIcon prop', () => {
    // When no src is provided and showError is true, loading shows instead of error
    // Error state requires the image load to fail, which can't be simulated in this test env
    // So we test that the prop is accepted without errors
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            width: 100,
            height: 100,
            errorIcon: 'warning',
          });
        },
      }),
    );
    expect(container.querySelector('view')).not.toBeNull();
  });

  it('should render loading icon with loadingIcon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            width: 100,
            height: 100,
            loadingIcon: 'success',
          });
        },
      }),
    );
    // Loading placeholder should be shown with a different icon
    const textEls = container.querySelectorAll('text');
    // 'success' icon maps to checkmark unicode
    const iconText = Array.from(textEls).find((t) => t.textContent === '\u2713');
    expect(iconText).toBeTruthy();
  });

  it('should accept iconSize prop for loading icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            width: 100,
            height: 100,
            iconSize: '3rem',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    // The icon text element should have fontSize set
    const hasSize = Array.from(textEls).some((t) => {
      const style = t.getAttribute('style') || '';
      return style.includes('3rem');
    });
    expect(hasSize).toBe(true);
  });

  it('should not render image when src is empty', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: '', width: 100, height: 100 });
        },
      }),
    );
    expect(container.querySelector('image')).toBeNull();
  });

  it('should accept all Vant props without errors', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: 'https://example.com/img.jpg',
            fit: 'contain',
            position: 'top',
            alt: 'test image',
            width: 100,
            height: 100,
            radius: 8,
            round: false,
            block: true,
            lazyLoad: false,
            showError: true,
            showLoading: true,
            errorIcon: 'photo-fail',
            loadingIcon: 'photo',
            iconSize: 32,
            iconPrefix: 'van-icon',
            crossorigin: 'anonymous',
            referrerpolicy: 'no-referrer',
            decoding: 'async',
          });
        },
      }),
    );
    expect(container.querySelector('view')).not.toBeNull();
    expect(container.querySelector('image')).not.toBeNull();
  });

  it('should have overflow hidden on container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: 'https://example.com/img.jpg', width: 100, height: 100 });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('overflow');
    expect(style).toContain('hidden');
  });
});
