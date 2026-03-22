import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import IndexBar from '../../IndexBar/index.vue';
import IndexAnchor from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
}

describe('IndexAnchor', () => {
  it('should render anchor with index text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('A');
  });

  it('should render numeric index', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: [1] }, {
            default: () => h(IndexAnchor, { index: 1 }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('1');
  });

  it('should render custom content via default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }, {
              default: () => h('text', {}, 'Custom Title A'),
            }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('Custom Title A');
  });

  it('should show active background when selected', async () => {
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
    await later();

    // Tap on 'A' in sidebar to activate it
    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );
    await fireEvent.tap(sidebarTexts[0]); // tap 'A'
    await later();

    // Find anchor views (not sidebar) — anchors have height: 32px
    const views = container.querySelectorAll('view');
    const anchorViews = Array.from(views).filter(
      (el: any) => el.getAttribute('style')?.includes('height: 32px'),
    );
    expect(anchorViews.length).toBeGreaterThan(0);

    // Active anchor should have background color
    const activeAnchor = anchorViews[0];
    const style = activeAnchor.getAttribute('style') || '';
    expect(style).toContain('background-color: rgb(242, 243, 245)');
  });

  it('should use parent highlightColor for text color when active', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'], highlightColor: '#ff0000' }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    await later();

    // Tap on 'A' in sidebar
    const allTexts = container.querySelectorAll('text');
    const sidebarTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('text-align: center'),
    );
    await fireEvent.tap(sidebarTexts[0]);
    await later();

    // Find anchor text (not sidebar text) — anchor texts have font-size: 14px
    const anchorTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('font-size: 14px'),
    );
    expect(anchorTexts.length).toBeGreaterThan(0);

    const textStyle = anchorTexts[0].getAttribute('style') || '';
    expect(textStyle).toContain('color: rgb(255, 0, 0)');
  });

  it('should render with default styling', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const anchorViews = Array.from(views).filter(
      (el: any) => el.getAttribute('style')?.includes('height: 32px'),
    );
    expect(anchorViews.length).toBeGreaterThan(0);
    const style = anchorViews[0].getAttribute('style') || '';
    expect(style).toContain('padding-left: 16px');
    expect(style).toContain('background-color: transparent');
  });

  it('should render multiple anchors', () => {
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
    const views = container.querySelectorAll('view');
    const anchorViews = Array.from(views).filter(
      (el: any) => el.getAttribute('style')?.includes('height: 32px'),
    );
    expect(anchorViews.length).toBe(3);
  });

  it('should show inactive color when not selected', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    // Anchor text should use default inactive color
    const allTexts = container.querySelectorAll('text');
    const anchorTexts = Array.from(allTexts).filter(
      (el: any) => el.getAttribute('style')?.includes('font-size: 14px'),
    );
    expect(anchorTexts.length).toBeGreaterThan(0);
    const style = anchorTexts[0].getAttribute('style') || '';
    expect(style).toContain('color: rgb(50, 50, 51)');
  });
});
