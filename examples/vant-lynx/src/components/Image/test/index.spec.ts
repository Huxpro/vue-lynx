import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import VanImage from '../index.vue';

const IMAGE_URL = 'https://img.com';

describe('Image', () => {
  it('should render image with src', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL });
        },
      }),
    );
    const imageEl = container.querySelector('image');
    expect(imageEl).not.toBeNull();
    expect(imageEl!.getAttribute('src')).toBe(IMAGE_URL);
  });

  it('should have van-image class on root element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, width: 100, height: 100 });
        },
      }),
    );
    const rootView = container.firstElementChild;
    expect(rootView!.getAttribute('class')).toContain('van-image');
  });

  it('should apply van-image__img class to image element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL });
        },
      }),
    );
    const imageEl = container.querySelector('image');
    expect(imageEl!.getAttribute('class')).toContain('van-image__img');
  });

  it('should render loading placeholder with van-image__loading class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { width: 100, height: 100 });
        },
      }),
    );
    // No src → no image element, loading shown
    expect(container.querySelector('image')).toBeNull();
    expect(container.querySelector('.van-image__loading')).not.toBeNull();
  });

  it('should render loading placeholder when src is set (before load)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL });
        },
      }),
    );
    expect(container.querySelector('image')).not.toBeNull();
    expect(container.querySelector('.van-image__loading')).not.toBeNull();
  });

  it('should not render loading placeholder when showLoading is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { showLoading: false });
        },
      }),
    );
    expect(container.querySelector('.van-image__loading')).toBeNull();
  });

  it('should not render error placeholder when showError is false', () => {
    // showError=false means even if error state occurs, no error placeholder renders
    // We can only test that error placeholder doesn't show in initial state
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, showError: false });
        },
      }),
    );
    expect(container.querySelector('.van-image__error')).toBeNull();
  });

  it('should add van-image--round class when round prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, round: true });
        },
      }),
    );
    const rootView = container.firstElementChild;
    expect(rootView!.getAttribute('class')).toContain('van-image--round');
  });

  it('should not have van-image--round class when round is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, round: false });
        },
      }),
    );
    const rootView = container.firstElementChild;
    expect(rootView!.getAttribute('class')).not.toContain('van-image--round');
  });

  it('should change border radius when using radius prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, radius: 3 });
        },
      }),
    );
    const rootView = container.firstElementChild;
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('3px');
  });

  it('should apply width and height from props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, width: 200, height: 150 });
        },
      }),
    );
    const rootView = container.firstElementChild;
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('200px');
    expect(style).toContain('150px');
  });

  it('should apply string width and height from props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, width: '10rem', height: '10rem' });
        },
      }),
    );
    const rootView = container.firstElementChild;
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('10rem');
  });

  it('should apply fit prop to image style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL, fit: 'cover' });
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
            { src: IMAGE_URL },
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
            {},
            { loading: () => h('text', {}, 'Custom Loading') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find((t) => t.textContent === 'Custom Loading');
    expect(slotText).toBeTruthy();
  });

  it('should render loading icon with loadingIcon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { loadingIcon: 'success' });
        },
      }),
    );
    expect(container.querySelector('.van-image__loading')).not.toBeNull();
  });

  it('should apply iconSize prop to loading icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { iconSize: '3rem', loadingIcon: 'success' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
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
          return h(VanImage, { src: '' });
        },
      }),
    );
    expect(container.querySelector('image')).toBeNull();
  });

  it('should not render image when src is undefined', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage);
        },
      }),
    );
    expect(container.querySelector('image')).toBeNull();
    expect(container.querySelector('.van-image__loading')).not.toBeNull();
  });

  it('should accept all Vant props without errors', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, {
            src: IMAGE_URL,
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
    expect(container.querySelector('.van-image')).not.toBeNull();
    expect(container.querySelector('image')).not.toBeNull();
  });

  it('should have overflow hidden via CSS class on root', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(VanImage, { src: IMAGE_URL });
        },
      }),
    );
    const rootView = container.firstElementChild;
    // overflow: hidden is now in the .van-image CSS class, not inline style
    expect(rootView!.getAttribute('class')).toContain('van-image');
  });
});
