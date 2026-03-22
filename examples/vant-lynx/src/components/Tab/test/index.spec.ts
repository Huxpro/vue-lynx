import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabs from '../../Tabs/index.vue';
import Tab from '../index.vue';

// Helper: wait for nextTick + microtask flush
async function later(ms = 0) {
  await nextTick();
  if (ms > 0) {
    await new Promise((r) => setTimeout(r, ms));
  }
  await nextTick();
}

// Helper: find tab header views by BEM class .van-tab
function findTabHeaders(container: Element): Element[] {
  return Array.from(container.querySelectorAll('.van-tab'));
}

// Helper: find text by content
function findText(container: Element, content: string): Element | undefined {
  const texts = Array.from(container.querySelectorAll('text'));
  return texts.find((t) => t.textContent === content);
}

describe('Tab', () => {
  it('should render tab panel with BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Content1' }),
            ],
          });
        },
      }),
    );
    await later();

    const panel = container.querySelector('.van-tab__panel');
    expect(panel).toBeTruthy();
  });

  it('should emit click-tab event when tab is clicked', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => '1' }),
              h(Tab, { title: 'title2' }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);

    await fireEvent.tap(headers[0]);
    await later();

    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 0,
        title: 'title1',
      }),
    );
  });

  it('should not render zero badge when show-zero-badge prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab1', badge: 0 }, { default: () => '1' }),
              h(Tab, { title: 'Tab2', badge: 0, showZeroBadge: false }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Only Tab1 should show "0" badge
    const texts = Array.from(container.querySelectorAll('text'));
    const badgeTexts = texts.filter((t) => t.textContent?.trim() === '0');
    expect(badgeTexts.length).toBe(1);
  });

  it('should switch tab after click the tab title', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, onChange }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2' }, { default: () => 'Text2' }),
              h(Tab, { title: 'title3', disabled: true }, { default: () => 'Text3' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    expect(headers.length).toBe(3);

    // Click title2 to switch
    await fireEvent.tap(headers[1]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(1);

    // Click disabled title3 - should not trigger onChange
    await fireEvent.tap(headers[2]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should render tab content with lazy-render enabled by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Content1' }),
              h(Tab, { title: 'title2' }, { default: () => 'Content2' }),
            ],
          });
        },
      }),
    );
    await later();

    // With lazy render, only the active tab's content should be rendered
    expect(findText(container, 'Content1')).toBeTruthy();
  });

  it('should render all tabs when lazy-render is disabled', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lazyRender: false }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Content1' }),
              h(Tab, { title: 'title2' }, { default: () => 'Content2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Both tabs should have content rendered
    expect(findText(container, 'Content1')).toBeTruthy();
    expect(findText(container, 'Content2')).toBeTruthy();
  });

  it('should not render empty tab panel', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'title1' }),
              h(Tab, { title: 'title2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Tab headers should render
    expect(findText(container, 'title1')).toBeTruthy();
    expect(findText(container, 'title2')).toBeTruthy();
  });

  it('should render dot prop correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab1', dot: true }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();

    // Should have a dot element
    const dotView = container.querySelector('.van-badge--dot');
    expect(dotView).toBeTruthy();
  });

  it('should render badge prop correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab1', badge: '10' }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();

    // Should render badge text "10"
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some((t) => t.textContent?.trim() === '10')).toBe(true);
  });

  it('should apply title-style prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'title1', titleStyle: { backgroundColor: 'red' } }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2', titleStyle: { backgroundColor: 'blue' } }, { default: () => 'Text2' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    const header1Style = headers[0]?.getAttribute('style') || '';
    const header2Style = headers[1]?.getAttribute('style') || '';
    expect(header1Style).toContain('background-color: red');
    expect(header2Style).toContain('background-color: blue');
  });

  it('should hide bottom border when border prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, border: false }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();

    // Wrap should NOT have hairline class
    const wrap = container.querySelector('.van-tabs__wrap');
    expect(wrap).toBeTruthy();
    expect(wrap!.getAttribute('class')).not.toContain('van-hairline');
  });

  it('should emit rendered event after tab is rendered', async () => {
    const onRendered = vi.fn();
    render(
      defineComponent({
        render() {
          return h(Tabs, { active: 'a', onRendered }, {
            default: () => [
              h(Tab, { name: 'a', title: 'title1' }, { default: () => 'Text1' }),
              h(Tab, { name: 'b', title: 'title2' }, { default: () => 'Text2' }),
            ],
          });
        },
      }),
    );
    await later();

    expect(onRendered).toHaveBeenCalledWith('a', 'title1');
  });

  it('should not trigger rendered event when lazy-render is disabled', async () => {
    const onRendered = vi.fn();
    render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lazyRender: false, onRendered }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => 'Text1' }),
              h(Tab, { title: 'Tab2' }, { default: () => 'Text2' }),
            ],
          });
        },
      }),
    );
    await later();

    expect(onRendered).toHaveBeenCalledTimes(0);
  });

  it('should allow to set name prop', async () => {
    const onChange = vi.fn();
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 'a', onChange, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1', name: 'a' }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2', name: 'b' }, { default: () => 'Text2' }),
              h(Tab, { title: 'title3', name: 'c', disabled: true }, { default: () => 'Text3' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);

    // Click tab b
    await fireEvent.tap(headers[1]);
    await later();

    expect(onChange).toHaveBeenCalledWith('b', 'title2');
    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'b' }),
    );

    // Click disabled tab c
    await fireEvent.tap(headers[2]);
    await later();

    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'c', disabled: true }),
    );
    // onChange should not be called for disabled tab
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should allow name prop to be zero', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 1, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1', name: 1 }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2', name: 0 }, { default: () => 'Text2' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    await fireEvent.tap(headers[1]);
    await later();

    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({ name: 0 }),
    );
  });

  it('should not render header when showHeader is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, showHeader: false }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2' }, { default: () => 'Text2' }),
            ],
          });
        },
      }),
    );
    await later();

    // No tab title texts should be visible
    expect(findText(container, 'title1')).toBeUndefined();
    expect(findText(container, 'title2')).toBeUndefined();
    // But content should still render
    expect(findText(container, 'Text1')).toBeTruthy();
  });

  it('should call before-change prop before changing', async () => {
    const onChange = vi.fn();
    const beforeChange = vi.fn((name: number) => {
      if (name === 1) return false;
      if (name === 2) return true;
      if (name === 3) return Promise.resolve(false);
      if (name === 4) return Promise.resolve(true);
    });

    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, onChange, beforeChange }, {
            default: () => [
              h(Tab, { title: 'title1' }, { default: () => 'Text1' }),
              h(Tab, { title: 'title2' }, { default: () => 'Text2' }),
              h(Tab, { title: 'title3' }, { default: () => 'Text3' }),
              h(Tab, { title: 'title4' }, { default: () => 'Text4' }),
              h(Tab, { title: 'title5' }, { default: () => 'Text5' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);

    // Click tab 1 - beforeChange returns false, should not change
    await fireEvent.tap(headers[1]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(0);

    // Click tab 2 - beforeChange returns true, should change
    await fireEvent.tap(headers[2]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(2, 'title3');

    // Click tab 3 - beforeChange returns Promise(false), should not change
    await fireEvent.tap(headers[3]);
    await later(50);
    expect(onChange).toHaveBeenCalledTimes(1);

    // Click tab 4 - beforeChange returns Promise(true), should change
    await fireEvent.tap(headers[4]);
    await later(50);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(4, 'title5');
  });

  it('should render line indicator for line type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lineWidth: 20, lineHeight: 5 }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => '1' }),
            ],
          });
        },
      }),
    );
    await later();

    const lineView = container.querySelector('.van-tabs__line');
    expect(lineView).toBeTruthy();
    const style = lineView!.getAttribute('style') || '';
    expect(style).toContain('width: 20px');
    expect(style).toContain('height: 5px');
  });

  it('should auto-index tabs when no name prop given', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'First' }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Second' }, { default: () => 'Content 2' }),
              h(Tab, { title: 'Third' }, { default: () => 'Content 3' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    await fireEvent.tap(headers[1]);
    await later();

    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({ name: 1 }),
    );
  });

  it('should render card type correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, type: 'card' }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => '1' }),
              h(Tab, { title: 'Tab2' }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Root should have card modifier
    const root = container.querySelector('.van-tabs--card');
    expect(root).toBeTruthy();

    // Nav should have card modifier
    const nav = container.querySelector('.van-tabs__nav--card');
    expect(nav).toBeTruthy();

    // Tab headers should have card modifier
    const headers = container.querySelectorAll('.van-tab--card');
    expect(headers.length).toBe(2);
  });

  it('should update active tab when active prop changes', async () => {
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return { active };
        },
        render() {
          return h(Tabs, { active: this.active, lazyRender: false }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => 'Content1' }),
              h(Tab, { title: 'Tab2' }, { default: () => 'Content2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Initially Tab1 content visible
    expect(findText(container, 'Content1')).toBeTruthy();

    // Change active to 1
    active.value = 1;
    await later();

    expect(findText(container, 'Content2')).toBeTruthy();
  });

  it('should apply custom title colors', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Tabs,
            { active: 0, titleActiveColor: '#ee0a24', titleInactiveColor: '#969799' },
            {
              default: () => [
                h(Tab, { title: 'Active' }, { default: () => 'Content1' }),
                h(Tab, { title: 'Inactive' }, { default: () => 'Content2' }),
              ],
            },
          );
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    const activeStyle = headers[0]?.getAttribute('style') || '';
    const inactiveStyle = headers[1]?.getAttribute('style') || '';
    expect(activeStyle).toContain('color');
    expect(inactiveStyle).toContain('color');
  });

  it('should render disabled tab with disabled BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Normal' }, { default: () => '1' }),
              h(Tab, { title: 'Disabled', disabled: true }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);

    // Normal tab should have --active class
    expect(headers[0].getAttribute('class')).toContain('van-tab--active');
    expect(headers[0].getAttribute('class')).not.toContain('van-tab--disabled');

    // Disabled tab should have --disabled class
    expect(headers[1].getAttribute('class')).toContain('van-tab--disabled');
  });

  it('should render active tab with active BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 1 }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => '1' }),
              h(Tab, { title: 'Tab2' }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    const headers = findTabHeaders(container);
    expect(headers[0].getAttribute('class')).not.toContain('van-tab--active');
    expect(headers[1].getAttribute('class')).toContain('van-tab--active');
  });
});
