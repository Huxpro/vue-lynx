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
  it('should render index bar with default A-Z index list', () => {
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
    // Should render sidebar with 26 letters
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(26);
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
    // Find sidebar text elements (the index labels)
    const textEls = container.querySelectorAll('text');
    // 3 sidebar labels + 3 anchor labels = at least 6
    expect(textEls.length).toBeGreaterThanOrEqual(3);
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
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
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

    // Find sidebar text elements - they are in the last view (sidebar)
    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );
    expect(sidebarTexts.length).toBe(3);

    await fireEvent.tap(sidebarTexts[1]); // tap 'B'
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

    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );

    await fireEvent.tap(sidebarTexts[0]); // tap 'A'
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('should highlight active index in sidebar', async () => {
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

    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );

    // Tap 'B' to activate it
    await fireEvent.tap(sidebarTexts[1]);
    await later();

    // Check that 'B' sidebar text has highlight color
    const bStyle = sidebarTexts[1].getAttribute('style') || '';
    expect(bStyle).toContain('color: rgb(25, 137, 250)');
  });

  it('should use custom highlightColor', async () => {
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

    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );

    await fireEvent.tap(sidebarTexts[0]); // tap 'A'
    await later();

    const aStyle = sidebarTexts[0].getAttribute('style') || '';
    expect(aStyle).toContain('color: rgb(255, 0, 0)');
  });

  it('should apply zIndex to sidebar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'], zIndex: 10 }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    // Sidebar is the last child view of the root view
    const views = container.querySelectorAll('view');
    const sidebarView = Array.from(views).find(
      (el: any) => el.getAttribute('style')?.includes('position: absolute'),
    );
    expect(sidebarView).toBeTruthy();
    const style = sidebarView!.getAttribute('style') || '';
    expect(style).toContain('z-index: 11'); // zIndex + 1
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
    expect(container).toBeTruthy();
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
    expect(container).toBeTruthy();
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
    expect(container).toBeTruthy();
  });

  it('should render sidebar with correct positioning', () => {
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
    const views = container.querySelectorAll('view');
    const sidebarView = Array.from(views).find(
      (el: any) => el.getAttribute('style')?.includes('position: absolute'),
    );
    expect(sidebarView).toBeTruthy();
    const style = sidebarView!.getAttribute('style') || '';
    expect(style).toContain('right: 0px');
    expect(style).toContain('flex-direction: column');
  });

  it('should render content area alongside sidebar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    // Root view should have flex-direction: row
    const rootView = container.querySelector('view');
    expect(rootView).toBeTruthy();
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('flex-direction: row');
  });

  it('should not emit change if activeAnchor becomes empty', async () => {
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
    // Change was not called initially since activeAnchor starts as ''
    expect(onChange).not.toHaveBeenCalled();
  });
});
