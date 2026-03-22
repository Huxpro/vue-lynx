import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Grid from '../index.vue';
import GridItem from '../../GridItem/index.vue';

describe('Grid', () => {
  it('should render default 4-column grid with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => [
              h(GridItem, { icon: '★', text: 'Item 1' }),
              h(GridItem, { icon: '★', text: 'Item 2' }),
              h(GridItem, { icon: '★', text: 'Item 3' }),
              h(GridItem, { icon: '★', text: 'Item 4' }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map(el => el.textContent);
    expect(texts).toContain('Item 1');
    expect(texts).toContain('Item 2');
    expect(texts).toContain('Item 3');
    expect(texts).toContain('Item 4');
  });

  it('should render flex-wrap grid container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const gridView = container.querySelector('view');
    const style = gridView!.getAttribute('style') || '';
    expect(style).toContain('display: flex');
    expect(style).toContain('flex-wrap: wrap');
  });

  it('should set column width based on columnNum', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { columnNum: 3 }, {
            default: () => [
              h(GridItem, { text: 'A' }),
              h(GridItem, { text: 'B' }),
              h(GridItem, { text: 'C' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('flex-basis');
    });
    expect(itemViews.length).toBeGreaterThan(0);
    const style = itemViews[0].getAttribute('style') || '';
    expect(style).toContain('33.333');
  });

  it('should render square grid items', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { square: true, columnNum: 2 }, {
            default: () => [
              h(GridItem, { text: 'A' }),
              h(GridItem, { text: 'B' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemRoots = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('padding-top: 50%');
    });
    expect(itemRoots.length).toBe(2);
  });

  it('should apply gutter padding on grid', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { gutter: 10 }, {
            default: () => [
              h(GridItem, { text: 'A' }),
              h(GridItem, { text: 'B' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const gridView = container.querySelector('view');
    const gridStyle = gridView!.getAttribute('style') || '';
    expect(gridStyle).toContain('padding-left: 10px');
  });

  it('should render square grid with gutter correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { square: true, columnNum: 2, gutter: 10 }, {
            default: () => [
              h(GridItem, { text: 'A' }),
              h(GridItem, { text: 'B' }),
              h(GridItem, { text: 'C' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    // In square+gutter mode, content has right/bottom offset for spacing
    const views = container.querySelectorAll('view');
    const contentViews = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('right: 10px') && s.includes('bottom: 10px');
    });
    expect(contentViews.length).toBe(3);
  });

  it('should apply marginTop for items past first row when gutter is set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { gutter: 10, columnNum: 2 }, {
            default: () => [
              h(GridItem, { text: 'A' }),
              h(GridItem, { text: 'B' }),
              h(GridItem, { text: 'C' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemsWithMarginTop = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('margin-top: 10px');
    });
    expect(itemsWithMarginTop.length).toBe(1); // Only third item (index 2 >= columnNum 2)
  });

  it('should pass iconSize to grid items via Icon', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { iconSize: 10 }, {
            default: () => h(GridItem, { icon: '★' }),
          });
        },
      }),
    );
    await nextTick();
    // Icon renders as <text> with font-size
    const textEls = container.querySelectorAll('text');
    const iconTexts = Array.from(textEls).filter(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('font-size') && s.includes('10');
    });
    expect(iconTexts.length).toBeGreaterThan(0);
  });

  it('should pass iconColor to grid item icon', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { icon: '★', iconColor: 'red' }),
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const iconTexts = Array.from(textEls).filter(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('color: red') || s.includes('color:red');
    });
    expect(iconTexts.length).toBeGreaterThan(0);
  });

  it('should render icon slot content', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, null, {
              icon: () => h('text', null, 'Custom Icon'),
            }),
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map(el => el.textContent);
    expect(texts).toContain('Custom Icon');
  });

  it('should render horizontal direction', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { direction: 'horizontal' }, {
            default: () => h(GridItem, { icon: '★', text: 'Test' }),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const contentViews = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      // Content view should have flex-direction: row (not the grid wrapper)
      return s.includes('flex-direction: row') && s.includes('padding');
    });
    expect(contentViews.length).toBeGreaterThan(0);
  });

  it('should render reverse direction', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { reverse: true }, {
            default: () => h(GridItem, { icon: '★', text: 'Test' }),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const contentViews = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('flex-direction: column-reverse');
    });
    expect(contentViews.length).toBeGreaterThan(0);
  });

  it('should render border styles when border is true and no gutter', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    await nextTick();
    const gridView = container.querySelector('view');
    const style = gridView!.getAttribute('style') || '';
    expect(style).toContain('border-top-width: 0.5');
    expect(style).toContain('border-left-width: 0.5');
  });

  it('should not render grid border when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: false }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const gridView = container.querySelector('view');
    const style = gridView!.getAttribute('style') || '';
    expect(style).not.toContain('border-top-width');
  });

  it('should emit click event on grid item tap', async () => {
    let clicked = false;
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { clickable: true }, {
            default: () => h(GridItem, {
              text: 'Click me',
              onClick: () => { clicked = true; },
            }),
          });
        },
      }),
    );
    await nextTick();
    // Find the content view (the one with padding that has the tap handler)
    const views = container.querySelectorAll('view');
    const contentView = Array.from(views).find(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('padding') && s.includes('flex-direction');
    });
    expect(contentView).not.toBeNull();
    await fireEvent.tap(contentView!);
    expect(clicked).toBe(true);
  });

  it('should render text for grid items', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { text: 'Hello World' }),
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map(el => el.textContent);
    expect(texts).toContain('Hello World');
  });

  it('should render default slot content in grid item', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, null, {
              default: () => h('text', null, 'Custom Content'),
            }),
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map(el => el.textContent);
    expect(texts).toContain('Custom Content');
  });

  it('should render surround border when both border and gutter are set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true, gutter: 10 }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const surroundViews = Array.from(views).filter(v => {
      const s = v.getAttribute('style') || '';
      return s.includes('border-width: 0.5') && s.includes('border-style: solid');
    });
    expect(surroundViews.length).toBeGreaterThan(0);
  });
});
