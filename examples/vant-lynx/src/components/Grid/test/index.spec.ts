import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Grid from '../index.vue';
import GridItem from '../../GridItem/index.vue';

describe('Grid', () => {
  it('should render with van-grid class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-grid')).not.toBeNull();
  });

  it('should render grid items with van-grid-item class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => [
              h(GridItem, { text: 'Item 1', key: 1 }),
              h(GridItem, { text: 'Item 2', key: 2 }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-grid-item');
    expect(items.length).toBe(2);
  });

  it('should render hairline-top when border and no gutter', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const grid = container.querySelector('.van-grid');
    expect(grid!.getAttribute('class')).toContain('van-hairline--top');
  });

  it('should not render hairline-top when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: false }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const grid = container.querySelector('.van-grid');
    expect(grid!.getAttribute('class')).not.toContain('van-hairline--top');
  });

  it('should not render hairline-top when gutter is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true, gutter: 10 }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const grid = container.querySelector('.van-grid');
    expect(grid!.getAttribute('class')).not.toContain('van-hairline--top');
  });

  it('should render content with center class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--center');
  });

  it('should render content with border class when border and no gutter', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--border');
  });

  it('should render content with surround class when border and gutter', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { border: true, gutter: 10 }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--surround');
  });

  // Vant test: should render square grid with gutter correctly
  it('should render square grid with gutter correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { square: true, columnNum: 2, gutter: 10 }, {
            default: () => [
              h(GridItem, { key: 1 }),
              h(GridItem, { key: 2 }),
              h(GridItem, { key: 3 }),
            ],
          });
        },
      }),
    );
    await nextTick();

    // Items should have --square class
    const items = container.querySelectorAll('.van-grid-item--square');
    expect(items.length).toBe(3);

    // Content should have --square class
    const contents = container.querySelectorAll('.van-grid-item__content--square');
    expect(contents.length).toBe(3);

    // Content should have right/bottom offset style (gutter)
    const content = container.querySelector('.van-grid-item__content');
    const style = content!.getAttribute('style') || '';
    expect(style).toContain('right: 10px');
    expect(style).toContain('bottom: 10px');
  });

  // Vant test: should change icon size when using icon-size prop
  it('should change icon size when using icon-size prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { iconSize: 10 }, {
            default: () => h(GridItem, { icon: 'success' }),
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const iconTexts = Array.from(textEls).filter(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('font-size') && s.includes('10');
    });
    expect(iconTexts.length).toBeGreaterThan(0);
  });

  // Vant test: should change icon color when using icon-color prop
  it('should change icon color when using icon-color prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { icon: 'success', iconColor: 'red' }),
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

  // Vant test: should render icon-slot correctly
  it('should render icon-slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { badge: '1' }, {
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

  // Vant test: should render reverse class
  it('should render reverse class when using reverse prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { reverse: true }, {
            default: () => h(GridItem),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--reverse');
  });

  // Vant test: should render badge-props correctly
  it('should render badge-props prop correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, {
              icon: 'success',
              badge: 1,
              badgeProps: { color: 'blue' },
            }),
          });
        },
      }),
    );
    await nextTick();
    const badge = container.querySelector('.van-badge');
    if (badge) {
      const style = badge.getAttribute('style') || '';
      expect(style).toContain('blue');
    }
  });

  it('should set column width based on columnNum', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { columnNum: 3 }, {
            default: () => [
              h(GridItem, { text: 'A', key: 1 }),
              h(GridItem, { text: 'B', key: 2 }),
              h(GridItem, { text: 'C', key: 3 }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const item = container.querySelector('.van-grid-item');
    const style = item!.getAttribute('style') || '';
    expect(style).toContain('33.333');
  });

  it('should apply gutter padding on grid container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { gutter: 10 }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const grid = container.querySelector('.van-grid');
    const style = grid!.getAttribute('style') || '';
    expect(style).toContain('padding-left: 10px');
  });

  it('should apply marginTop for items past first row when gutter is set', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { gutter: 10, columnNum: 2 }, {
            default: () => [
              h(GridItem, { text: 'A', key: 1 }),
              h(GridItem, { text: 'B', key: 2 }),
              h(GridItem, { text: 'C', key: 3 }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-grid-item');
    // Third item (index=2) should have margin-top since index >= columnNum (2)
    const thirdStyle = items[2]?.getAttribute('style') || '';
    expect(thirdStyle).toContain('margin-top: 10px');
    // First item should NOT have margin-top
    const firstStyle = items[0]?.getAttribute('style') || '';
    expect(firstStyle).not.toContain('margin-top');
  });

  it('should render horizontal direction class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { direction: 'horizontal' }, {
            default: () => h(GridItem, { icon: 'photo-o', text: 'Test' }),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--horizontal');
  });

  it('should render clickable class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { clickable: true }, {
            default: () => h(GridItem, { text: 'Test' }),
          });
        },
      }),
    );
    const content = container.querySelector('.van-grid-item__content');
    expect(content!.getAttribute('class')).toContain('van-grid-item__content--clickable');
  });

  it('should render text with van-grid-item__text class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, null, {
            default: () => h(GridItem, { text: 'Hello World' }),
          });
        },
      }),
    );
    const textEl = container.querySelector('.van-grid-item__text');
    expect(textEl).not.toBeNull();
    expect(textEl!.textContent).toBe('Hello World');
  });

  it('should render default slot content in grid item', () => {
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
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map(el => el.textContent);
    expect(texts).toContain('Custom Content');
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
    const content = container.querySelector('.van-grid-item__content');
    expect(content).not.toBeNull();
    await fireEvent.tap(content!);
    expect(clicked).toBe(true);
  });

  it('should render square class on items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { square: true, columnNum: 2 }, {
            default: () => [
              h(GridItem, { text: 'A', key: 1 }),
              h(GridItem, { text: 'B', key: 2 }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-grid-item--square');
    expect(items.length).toBe(2);
    // Content should also have square class
    const contents = container.querySelectorAll('.van-grid-item__content--square');
    expect(contents.length).toBe(2);
  });

  it('should render paddingTop as percent for square items', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Grid, { square: true, columnNum: 2 }, {
            default: () => [
              h(GridItem, { text: 'A', key: 1 }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const item = container.querySelector('.van-grid-item--square');
    const style = item!.getAttribute('style') || '';
    expect(style).toContain('padding-top: 50%');
  });
});
