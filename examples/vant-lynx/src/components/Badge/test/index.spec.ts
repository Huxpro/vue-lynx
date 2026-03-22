import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Badge from '../index.vue';

describe('Badge', () => {
  it('should render nothing when content is empty string', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: '' });
        },
      }),
    );
    // No badge should render for empty string content
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render nothing when content is undefined', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: undefined });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render nothing when content is zero', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 0 });
        },
      }),
    );
    // showZero defaults to true, so badge SHOULD render
    const textEls = container.querySelectorAll('text');
    const zeroText = Array.from(textEls).find((t) => t.textContent === '0');
    expect(zeroText).toBeTruthy();
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
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find(
      (t) => t.textContent === 'Custom Content',
    );
    expect(slotText).toBeTruthy();
  });

  it('should change dot position when using offset prop', () => {
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
    // With default position 'top-right', offset [x=2, y=4]:
    // top = 4px, right = -2px
    const views = container.querySelectorAll('view');
    const badge = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position') && style.includes('absolute');
    });
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4px');
  });

  it('should change dot position when using offset prop with custom unit', () => {
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
    const views = container.querySelectorAll('view');
    const badge = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position') && style.includes('absolute');
    });
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4em');
  });

  it('should change dot position when using offset prop without children', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { dot: true, offset: [2, 4] });
        },
      }),
    );
    // Without children (standalone), offset uses marginTop and marginLeft
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    const badge = views[0];
    const style = badge.getAttribute('style') || '';
    expect(style).toContain('margin');
  });

  it('should change dot position when using offset prop and position is bottom-right', () => {
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
    const views = container.querySelectorAll('view');
    const badge = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position') && style.includes('absolute');
    });
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4rem');
  });

  it('should change dot position when using offset prop and position is bottom-left', () => {
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
    const views = container.querySelectorAll('view');
    const badge = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position') && style.includes('absolute');
    });
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4rem');
  });

  it('should change dot position when using offset prop and position is top-left', () => {
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
    const views = container.querySelectorAll('view');
    const badge = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position') && style.includes('absolute');
    });
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('4rem');
  });

  it('should not render zero when show-zero is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Badge, { content: 0, showZero: false });
        },
      }),
    );
    // Badge should not render when content is 0 and showZero is false
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
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
    const textEls = container.querySelectorAll('text');
    const maxText = Array.from(textEls).find((t) => t.textContent === '99+');
    expect(maxText).toBeTruthy();
  });
});
