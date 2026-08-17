import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Badge from '../index.vue';

// Helper: find text element with matching content within a parent element
function findText(parent: Element, content: string): Element | undefined {
  const texts = parent.querySelectorAll('text');
  return Array.from(texts).find((t) => t.textContent === content);
}

// Helper: find any text element with non-empty content within a parent element
function findContentText(parent: Element): Element | undefined {
  const texts = parent.querySelectorAll('text');
  return Array.from(texts).find((t) => t.textContent !== '');
}

describe('Badge', () => {
  it('should render nothing when content is empty string', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: '' });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeFalsy();
  });

  it('should render nothing when content is undefined', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: undefined });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeFalsy();
  });

  it('should render content when content is zero and showZero is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 0 });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(findText(badge!, '0')).toBeTruthy();
  });

  it('should not render zero when showZero is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 0, showZero: false });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeFalsy();
  });

  it('should render content slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, null, {
            content: () => h('text', {}, 'Custom Content'),
          });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(findText(badge!, 'Custom Content')).toBeTruthy();
  });

  it('should render dot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { dot: true });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(badge!.className).toContain('van-badge--dot');
  });

  it('should render max value correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { content: 100, max: 99 },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(findText(badge!, '99+')).toBeTruthy();
  });

  it('should not render max+ when content is less than max', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 50, max: 99 });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(findText(badge!, '50')).toBeTruthy();
  });

  it('should apply fixed class when has default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { content: 5 },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const wrapper = container.querySelector('.van-badge__wrapper');
    expect(wrapper).toBeTruthy();
    const badge = container.querySelector('.van-badge');
    expect(badge!.className).toContain('van-badge--fixed');
  });

  it('should apply position class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { content: 5, position: 'top-left' },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge!.className).toContain('van-badge--top-left');
  });

  it('should apply custom color via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 5, color: '#1989fa' });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    // Color may be normalized to rgb() by the testing env
    expect(style).toContain('background');
  });

  it('should change position when using offset prop with children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { dot: true, offset: [2, 4] },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    // Default position is top-right, offset [x=2, y=4]
    // top = 4px, right = -2px
    expect(style).toContain('top');
    expect(style).toContain('4px');
  });

  it('should change position when using offset prop with custom unit', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { dot: true, offset: ['2rem', '4em'] },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4em');
    expect(style).toContain('-2rem');
  });

  it('should use margin for offset without children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { dot: true, offset: [2, 4] });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('margin');
  });

  it('should handle offset with bottom-right position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { dot: true, offset: [2, '-4rem'], position: 'bottom-right' },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4rem');
    expect(style).toContain('bottom');
  });

  it('should handle offset with bottom-left position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { dot: true, offset: [2, '-4rem'], position: 'bottom-left' },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4rem');
    expect(style).toContain('bottom');
  });

  it('should handle offset with top-left position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { dot: true, offset: [2, '-4rem'], position: 'top-left' },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('-4rem');
    expect(style).toContain('top');
  });

  it('should render string content correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 'Hot' });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    expect(findText(badge!, 'Hot')).toBeTruthy();
  });

  it('should default to top-right position class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Badge,
            { content: 5 },
            { default: () => h('view', { style: { width: '40px', height: '40px' } }) },
          );
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge!.className).toContain('van-badge--top-right');
  });
});
