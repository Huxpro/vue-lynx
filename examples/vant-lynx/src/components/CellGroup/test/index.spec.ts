import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import CellGroup from '../index.vue';

describe('CellGroup', () => {
  it('should render title slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            title: () => h('text', {}, 'Custom Title'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Title');
  });

  it('should render title prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { title: 'Group Title' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Group Title');
  });

  it('should not render title when title is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const meaningfulTexts = Array.from(textEls).filter(
      (el) => el.textContent && el.textContent.trim().length > 0,
    );
    expect(meaningfulTexts.length).toBe(0);
  });

  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            default: () => h('text', {}, 'Cell Content'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Cell Content');
  });

  it('should render inset style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { inset: true }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // views[0] = wrapper, views[1] = group container
    const groupView = views[1];
    const style = groupView.getAttribute('style') || '';
    expect(style).toContain('border-radius');
    expect(style).toContain('8px');
    expect(style).toContain('16px');
  });

  it('should render border by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const groupView = views[1];
    const style = groupView.getAttribute('style') || '';
    expect(style).toContain('border-top');
  });

  it('should not render border when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { border: false }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const groupView = views[1];
    const style = groupView.getAttribute('style') || '';
    expect(style).not.toContain('border-top');
  });

  it('should not render border when inset is true even if border is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { inset: true, border: true }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const groupView = views[1];
    const style = groupView.getAttribute('style') || '';
    expect(style).not.toContain('border-top');
  });
});
