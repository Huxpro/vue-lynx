import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import IndexBar from '../index.vue';
import IndexAnchor from '../../IndexAnchor/index.vue';

async function later() {
  await nextTick();
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
}

describe('IndexBar', () => {
  it('should render with default A-Z index list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, null, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    // Root should have van-index-bar class
    const root = container.querySelector('.van-index-bar');
    expect(root).toBeTruthy();

    // Should render sidebar with 26 index items
    const indexItems = container.querySelectorAll('.van-index-bar__index');
    expect(indexItems.length).toBe(26);
  });

  it('should render with custom index list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    const indexItems = container.querySelectorAll('.van-index-bar__index');
    expect(indexItems.length).toBe(3);
  });

  it('should render with numeric index list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: [1, 2, 3] }, {
            default: () => [
              h(IndexAnchor, { index: 1 }),
              h(IndexAnchor, { index: 2 }),
              h(IndexAnchor, { index: 3 }),
            ],
          });
        },
      }),
    );
    const indexItems = container.querySelectorAll('.van-index-bar__index');
    const texts = Array.from(indexItems).map((el: any) => el.textContent);
    expect(texts).toContain('1');
    expect(texts).toContain('2');
    expect(texts).toContain('3');
  });

  it('should emit select event when index is tapped', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'], onSelect }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    await later();

    const indexItems = container.querySelectorAll('.van-index-bar__index');
    expect(indexItems.length).toBe(3);

    await fireEvent.tap(indexItems[1]); // tap 'B'
    expect(onSelect).toHaveBeenCalledWith('B');
  });

  it('should emit change event when active anchor changes', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'], onChange }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    await later();

    const indexItems = container.querySelectorAll('.van-index-bar__index');
    await fireEvent.tap(indexItems[0]); // tap 'A'
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('should highlight active index with --active modifier', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    await later();

    const indexItems = container.querySelectorAll('.van-index-bar__index');
    await fireEvent.tap(indexItems[1]); // tap 'B'
    await later();

    // 'B' should have active modifier class
    expect(indexItems[1].classList.contains('van-index-bar__index--active')).toBe(true);
    // 'A' should not
    expect(indexItems[0].classList.contains('van-index-bar__index--active')).toBe(false);
  });

  it('should use custom highlightColor as inline style', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B'], highlightColor: '#ff0000' }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
            ],
          });
        },
      }),
    );
    await later();

    const indexItems = container.querySelectorAll('.van-index-bar__index');
    await fireEvent.tap(indexItems[0]); // tap 'A'
    await later();

    const style = indexItems[0].getAttribute('style') || '';
    expect(style).toContain('color');
  });

  it('should apply custom zIndex to sidebar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'], zIndex: 10 }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const sidebar = container.querySelector('.van-index-bar__sidebar');
    expect(sidebar).toBeTruthy();
    const style = sidebar!.getAttribute('style') || '';
    expect(style).toContain('z-index: 11');
  });

  it('should expose scrollTo method', async () => {
    const indexBarRef = ref<any>(null);
    const onSelect = vi.fn();
    render(
      defineComponent({
        render() {
          return h(IndexBar, {
            indexList: ['A', 'B', 'C'],
            onSelect,
            ref: (el: any) => { indexBarRef.value = el; },
          }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    await later();

    indexBarRef.value?.scrollTo('B');
    await later();
    expect(onSelect).toHaveBeenCalledWith('B');
  });

  it('should accept teleport prop for API parity', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { teleport: 'body', indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-index-bar')).toBeTruthy();
  });

  it('should accept sticky prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { sticky: false, indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-index-bar')).toBeTruthy();
  });

  it('should accept stickyOffsetTop prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { stickyOffsetTop: 50, indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-index-bar')).toBeTruthy();
  });

  it('should render sidebar and wrapper structure', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
            ],
          });
        },
      }),
    );
    expect(container.querySelector('.van-index-bar__wrapper')).toBeTruthy();
    expect(container.querySelector('.van-index-bar__sidebar')).toBeTruthy();
  });

  it('should render content inside wrapper', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const wrapper = container.querySelector('.van-index-bar__wrapper');
    expect(wrapper).toBeTruthy();
    // Anchor should be inside wrapper
    const anchor = wrapper!.querySelector('.van-index-anchor');
    expect(anchor).toBeTruthy();
  });

  it('should not emit change if activeAnchor starts empty', async () => {
    const onChange = vi.fn();
    render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B'], onChange }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
            ],
          });
        },
      }),
    );
    await later();
    expect(onChange).not.toHaveBeenCalled();
  });
});
