import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import CellGroup from '../index.vue';

describe('CellGroup', () => {
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

  it('should render with van-cell-group class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-cell-group');
    expect(group).toBeTruthy();
  });

  it('should render title prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { title: 'Group Title' });
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell-group__title');
    expect(titleEl).toBeTruthy();
    const textEls = titleEl!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Group Title');
  });

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
    const titleEl = container.querySelector('.van-cell-group__title');
    expect(titleEl).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Title');
  });

  it('should not render title when title is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup);
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell-group__title');
    expect(titleEl).toBeNull();
  });

  it('should render inset class when inset prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { inset: true }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-cell-group--inset');
    expect(group).toBeTruthy();
  });

  it('should render inset title class when inset and title are set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { inset: true, title: 'Inset Title' });
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell-group__title--inset');
    expect(titleEl).toBeTruthy();
  });

  it('should render hairline border by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-hairline--top-bottom');
    expect(group).toBeTruthy();
  });

  it('should not render hairline border when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { border: false }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-hairline--top-bottom');
    expect(group).toBeNull();
  });

  it('should not render hairline border when inset is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, { inset: true, border: true }, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-hairline--top-bottom');
    expect(group).toBeNull();
  });

  it('should not have inset class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(CellGroup, null, {
            default: () => h('text', {}, 'Content'),
          });
        },
      }),
    );
    const group = container.querySelector('.van-cell-group--inset');
    expect(group).toBeNull();
  });
});
