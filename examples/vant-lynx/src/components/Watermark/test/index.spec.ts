import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Watermark from '../index.vue';

describe('Watermark', () => {
  it('should render text content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            textColor: 'red',
          });
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    const wrapper = container.querySelector('.van-watermark__wrapper');
    expect(wrapper).toBeTruthy();
    // Should have text elements with the content
    const texts = container.querySelectorAll('text');
    const contentTexts = Array.from(texts).filter(
      (t) => t.textContent === 'Vant',
    );
    expect(contentTexts.length).toBeGreaterThan(0);
  });

  it('should render image watermark', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            image:
              'https://fastly.jsdelivr.net/npm/@vant/assets/vant-watermark.png',
            opacity: 0.5,
          });
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    // Image prop takes priority over content
    const images = container.querySelectorAll('image');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should render content slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Watermark,
            null,
            {
              content: () => h('text', null, 'vant watermark test'),
            },
          );
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    const texts = container.querySelectorAll('text');
    const slotTexts = Array.from(texts).filter(
      (t) => t.textContent === 'vant watermark test',
    );
    expect(slotTexts.length).toBeGreaterThan(0);
  });

  it('should apply width, height, rotate, and zIndex', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Watermark,
            {
              width: 20,
              height: 20,
              rotate: 20,
              zIndex: 200,
            },
            {
              content: () => h('text', null, 'vant watermark test'),
            },
          );
        },
      }),
    );
    const root = container.querySelector('.van-watermark') as HTMLElement;
    expect(root).toBeTruthy();
    // zIndex should be applied via inline style
    expect(root.style.zIndex).toBe('200');
  });

  it('should render with fullPage false (absolute position)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Watermark,
            {
              fullPage: false,
            },
            {
              content: () => h('text', null, 'vant watermark test'),
            },
          );
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    // Should NOT have the --full modifier class
    expect(root!.classList.contains('van-watermark--full')).toBe(false);
  });

  it('should render with fullPage true (fixed position)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            fullPage: true,
          });
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    // Should have the --full modifier class
    expect(root!.classList.contains('van-watermark--full')).toBe(true);
  });

  it('should render with default fullPage (true)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
          });
        },
      }),
    );
    const root = container.querySelector('.van-watermark');
    expect(root).toBeTruthy();
    expect(root!.classList.contains('van-watermark--full')).toBe(true);
  });

  it('should apply opacity style to cells', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            opacity: 0.3,
          });
        },
      }),
    );
    const wrapper = container.querySelector(
      '.van-watermark__wrapper',
    ) as HTMLElement;
    expect(wrapper).toBeTruthy();
    // First cell inside wrapper should have opacity
    const firstCell = wrapper.querySelector('view') as unknown as HTMLElement;
    expect(firstCell).toBeTruthy();
    expect(firstCell.style.opacity).toBe('0.3');
  });

  it('should apply gapX and gapY as margins', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            gapX: 30,
            gapY: 10,
          });
        },
      }),
    );
    const wrapper = container.querySelector(
      '.van-watermark__wrapper',
    ) as HTMLElement;
    const firstCell = wrapper?.querySelector('view') as unknown as HTMLElement;
    expect(firstCell).toBeTruthy();
    expect(firstCell.style.marginRight).toBe('30px');
    expect(firstCell.style.marginBottom).toBe('10px');
  });

  it('should apply rotate transform', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Watermark, {
            content: 'Vant',
            rotate: 45,
          });
        },
      }),
    );
    const wrapper = container.querySelector(
      '.van-watermark__wrapper',
    ) as HTMLElement;
    const firstCell = wrapper?.querySelector('view') as unknown as HTMLElement;
    expect(firstCell).toBeTruthy();
    expect(firstCell.style.transform).toBe('rotate(45deg)');
  });
});
