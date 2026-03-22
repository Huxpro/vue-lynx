import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabs from '../index.vue';
import Tab from '../../Tab/index.vue';

// Helper: find tab header views by BEM class
function findTabHeaders(container: any): any[] {
  return Array.from(container.querySelectorAll('.van-tab'));
}

// Helper: wait for tabs to initialize (children register async via nextTick)
async function later(ms = 0) {
  await nextTick();
  await nextTick();
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

describe('Tabs', () => {
  it('should render with BEM root class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1' }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2' }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await later();

    const root = container.querySelector('.van-tabs');
    expect(root).toBeTruthy();
    expect(root!.getAttribute('class')).toContain('van-tabs--line');
  });

  it('should render tabs container with headers', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
  });

  it('should render line type by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Line indicator should be rendered
    const lineView = container.querySelector('.van-tabs__line');
    expect(lineView).toBeTruthy();

    // Nav should have line modifier
    const nav = container.querySelector('.van-tabs__nav--line');
    expect(nav).toBeTruthy();
  });

  it('should render card type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, type: 'card' }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
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
    const cardTabs = container.querySelectorAll('.van-tab--card');
    expect(cardTabs.length).toBe(2);
  });

  it('should emit click-tab event when tab is clicked', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1', name: 0 }, { default: () => '1' }),
              h(Tab, { title: 'title2', name: 1 }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    await fireEvent.tap(headers[0]);
    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 0,
        title: 'title1',
        disabled: false,
      }),
    );
  });

  it('should emit click-tab event for disabled tab with disabled flag', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1', name: 0 }, { default: () => '1' }),
              h(Tab, { title: 'title2', name: 1, disabled: true }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    await fireEvent.tap(headers[1]);
    expect(onClickTab).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 1,
        title: 'title2',
        disabled: true,
      }),
    );
  });

  it('should switch tab after click the tab title', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, onChange }, {
            default: () => [
              h(Tab, { title: 'title1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'title2', name: 1 }, { default: () => 'Text' }),
              h(Tab, { title: 'title3', name: 2, disabled: true }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);

    await fireEvent.tap(headers[1]);
    await later();
    // Clicking disabled tab should not trigger change
    await fireEvent.tap(headers[2]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should auto-index tabs when no name prop given', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
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
    expect(headers.length).toBe(3);
  });

  it('should allow to set name prop', async () => {
    const onChange = vi.fn();
    const onClickTab = vi.fn();
    const active = ref<string | number>('a');

    const { container } = render(
      defineComponent({
        setup() {
          return { active };
        },
        render() {
          return h(Tabs, {
            active: this.active,
            'onUpdate:active': (val: any) => { active.value = val; },
            onChange,
            'onClick-tab': onClickTab,
          }, {
            default: () => [
              h(Tab, { title: 'title1', name: 'a' }, { default: () => 'Text' }),
              h(Tab, { title: 'title2', name: 'b' }, { default: () => 'Text' }),
              h(Tab, { title: 'title3', name: 'c', disabled: true }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);

    await fireEvent.tap(headers[1]);
    await later();
    expect(onChange).toHaveBeenCalledWith('b', 'title2');
    expect(onClickTab.mock.calls[0][0].name).toEqual('b');
    expect(onChange).toHaveBeenCalledTimes(1);

    await fireEvent.tap(headers[2]);
    expect(onClickTab.mock.calls[1][0].name).toEqual('c');
    // Disabled tab should not change
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should allow name prop to be zero', async () => {
    const onClickTab = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 1, 'onClick-tab': onClickTab }, {
            default: () => [
              h(Tab, { title: 'title1', name: 1 }, { default: () => 'Text' }),
              h(Tab, { title: 'title2', name: 0 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    await fireEvent.tap(headers[1]);
    expect(onClickTab.mock.calls[0][0].name).toEqual(0);
  });

  it('should not render zero badge when show-zero-badge prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0, badge: 0 }, { default: () => '1' }),
              h(Tab, { title: 'Tab 2', name: 1, badge: 0, showZeroBadge: false }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();
    // Only first tab should show a badge element
    const badgeViews = container.querySelectorAll('.van-badge--fixed');
    expect(badgeViews.length).toBe(1);
  });

  it('should render dot prop correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0, dot: true }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const dotView = container.querySelector('.van-badge--dot');
    expect(dotView).toBeTruthy();
  });

  it('should render badge prop correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0, badge: '10' }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const texts = container.querySelectorAll('text');
    const badgeText = Array.from(texts).find((t: any) => t.textContent === '10');
    expect(badgeText).toBeTruthy();
  });

  it('should emit rendered event after tab is rendered', async () => {
    const onRendered = vi.fn();
    const active = ref<string>('a');

    const { container } = render(
      defineComponent({
        setup() {
          return { active };
        },
        render() {
          return h(Tabs, {
            active: this.active,
            'onUpdate:active': (val: any) => { active.value = val; },
            onRendered,
          }, {
            default: () => [
              h(Tab, { name: 'a', title: 'title1' }, { default: () => 'Text' }),
              h(Tab, { name: 'b', title: 'title2' }, { default: () => 'Title2' }),
            ],
          });
        },
      }),
    );
    await later();
    expect(onRendered).toHaveBeenCalledWith('a', 'title1');

    const headers = findTabHeaders(container);
    await fireEvent.tap(headers[1]);
    await later();

    expect(onRendered).toHaveBeenCalledTimes(2);
  });

  it('should not trigger rendered event when lazy-render prop is disabled', async () => {
    const onRendered = vi.fn();

    render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lazyRender: false, onRendered }, {
            default: () => [
              h(Tab, { name: 0, title: 'Tab 1' }, { default: () => 'Text' }),
              h(Tab, { name: 1, title: 'Tab 2' }, { default: () => 'Title2' }),
            ],
          });
        },
      }),
    );
    await later();
    expect(onRendered).toHaveBeenCalledTimes(0);
  });

  it('should not render header when showHeader is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, showHeader: false }, {
            default: () => [
              h(Tab, { title: 'title1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'title2', name: 1 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    // No tab headers should be rendered when showHeader is false
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(0);
  });

  it('should call before-change prop before changing', async () => {
    const onChange = vi.fn();
    const beforeChange = (name: number) => {
      switch (name) {
        case 1:
          return false;
        case 2:
          return true;
        case 3:
          return Promise.resolve(false);
        case 4:
          return Promise.resolve(true);
      }
    };

    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, onChange, beforeChange }, {
            default: () => [
              h(Tab, { title: 'title1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'title2', name: 1 }, { default: () => 'Text' }),
              h(Tab, { title: 'title3', name: 2 }, { default: () => 'Text' }),
              h(Tab, { title: 'title4', name: 3 }, { default: () => 'Text' }),
              h(Tab, { title: 'title5', name: 4 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);

    // name=1 returns false, should be blocked
    await fireEvent.tap(headers[1]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(0);

    // name=2 returns true, should proceed
    await fireEvent.tap(headers[2]);
    await later();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(2, 'title3');

    // name=3 returns Promise.resolve(false), should be blocked
    await fireEvent.tap(headers[3]);
    await later(100);
    expect(onChange).toHaveBeenCalledTimes(1);

    // name=4 returns Promise.resolve(true), should proceed
    await fireEvent.tap(headers[4]);
    await later(100);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(4, 'title5');
  });

  it('should render nav-left and nav-right slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Title', name: 0 }, { default: () => 'Text' }),
            ],
            'nav-left': () => h('text', null, 'Custom nav left'),
            'nav-right': () => h('text', null, 'Custom nav right'),
          });
        },
      }),
    );
    await later();
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t: any) => t.textContent);
    expect(textContents).toContain('Custom nav left');
    expect(textContents).toContain('Custom nav right');
  });

  it('should render nav-bottom slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Title', name: 0 }, { default: () => 'Text' }),
            ],
            'nav-bottom': () => h('text', null, 'Nav Bottom'),
          });
        },
      }),
    );
    await later();
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t: any) => t.textContent);
    expect(textContents).toContain('Nav Bottom');
  });

  it('should show border for line type by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, border: true }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const wrap = container.querySelector('.van-tabs__wrap');
    expect(wrap).toBeTruthy();
    expect(wrap!.getAttribute('class')).toContain('van-hairline');
  });

  it('should hide border when border prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, border: false }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const wrap = container.querySelector('.van-tabs__wrap');
    expect(wrap).toBeTruthy();
    expect(wrap!.getAttribute('class')).not.toContain('van-hairline');
  });

  it('should expose resize and scrollTo methods', async () => {
    const tabsRef = ref<any>(null);
    render(
      defineComponent({
        setup() {
          return { tabsRef };
        },
        render() {
          return h(Tabs, {
            ref: (el: any) => { tabsRef.value = el; },
            active: 0,
          }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    expect(tabsRef.value).toBeTruthy();
    expect(typeof tabsRef.value.resize).toBe('function');
    expect(typeof tabsRef.value.scrollTo).toBe('function');
  });

  it('should watch active prop changes', async () => {
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return { active };
        },
        render() {
          return h(Tabs, {
            active: this.active,
            'onUpdate:active': (val: any) => { active.value = val; },
          }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Programmatically change active tab
    active.value = 1;
    await later();

    // Second tab should now have active class
    const headers = findTabHeaders(container);
    expect(headers[1].getAttribute('class')).toContain('van-tab--active');
  });

  it('should support custom color for line type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, color: '#ee0a24' }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    // Line indicator should have custom color
    const lineView = container.querySelector('.van-tabs__line');
    expect(lineView).toBeTruthy();
    const style = lineView!.getAttribute('style') || '';
    expect(style).toContain('background-color');
  });

  it('should support custom color for card type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, type: 'card', color: '#ee0a24' }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    // Active tab in card mode should have custom backgroundColor
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    const activeStyle = headers[0].getAttribute('style') || '';
    expect(activeStyle).toContain('background-color');
  });

  it('should use titleActiveColor and titleInactiveColor', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, {
            active: 0,
            titleActiveColor: '#ee0a24',
            titleInactiveColor: '#07c160',
          }, {
            default: () => [
              h(Tab, { title: 'Active', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Inactive', name: 1 }, { default: () => 'Text' }),
            ],
          });
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

  it('should support shrink mode', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, shrink: true }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();

    // Tab headers should have --shrink class
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    expect(headers[0].getAttribute('class')).toContain('van-tab--shrink');

    // Nav should have shrink modifier
    const nav = container.querySelector('.van-tabs__nav--shrink');
    expect(nav).toBeTruthy();
  });

  it('should lazy render tab panels', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lazyRender: true }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => h('text', null, 'Content 1') }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => h('text', null, 'Content 2') }),
            ],
          });
        },
      }),
    );
    await later();
    // Only active tab's content should be rendered
    const texts = container.querySelectorAll('text');
    const contentTexts = Array.from(texts).map((t: any) => t.textContent);
    expect(contentTexts).toContain('Content 1');
    // Tab 2 content should not be rendered yet (lazy)
    expect(contentTexts).not.toContain('Content 2');
  });

  it('should render all panels when lazyRender is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lazyRender: false }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => h('text', null, 'Content 1') }),
              h(Tab, { title: 'Tab 2', name: 1 }, { default: () => h('text', null, 'Content 2') }),
            ],
          });
        },
      }),
    );
    await later();
    const texts = container.querySelectorAll('text');
    const contentTexts = Array.from(texts).map((t: any) => t.textContent);
    expect(contentTexts).toContain('Content 1');
    expect(contentTexts).toContain('Content 2');
  });

  it('should support line-width and line-height props', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, lineWidth: 20, lineHeight: 5 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => '1' }),
            ],
          });
        },
      }),
    );
    await later();
    const lineView = container.querySelector('.van-tabs__line');
    expect(lineView).toBeTruthy();
    const lineStyle = lineView!.getAttribute('style') || '';
    expect(lineStyle).toContain('width: 20px');
    expect(lineStyle).toContain('height: 5px');
  });

  it('should support custom background', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, background: '#f2f3f5' }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const nav = container.querySelector('.van-tabs__nav');
    expect(nav).toBeTruthy();
    const style = nav!.getAttribute('style') || '';
    expect(style).toContain('background-color');
  });

  it('should disabled tab have disabled BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Normal', name: 0 }, { default: () => 'Text' }),
              h(Tab, { title: 'Disabled', name: 1, disabled: true }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    expect(headers[1].getAttribute('class')).toContain('van-tab--disabled');
  });

  it('should render content area with BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1' }, { default: () => 'Content' }),
            ],
          });
        },
      }),
    );
    await later();
    const content = container.querySelector('.van-tabs__content');
    expect(content).toBeTruthy();
  });

  it('should render wrap with BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1' }, { default: () => 'Content' }),
            ],
          });
        },
      }),
    );
    await later();
    const wrap = container.querySelector('.van-tabs__wrap');
    expect(wrap).toBeTruthy();
  });

  it('should not render empty tab', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }),
              h(Tab, { title: 'Tab 2', name: 1 }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    // Panels should still be rendered even with no content
    const panels = container.querySelectorAll('.van-tab__panel');
    expect(panels.length).toBe(2);
  });

  it('should change title style when using title-style prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0, titleStyle: { fontWeight: 'bold' } }, { default: () => 'Text' }),
              h(Tab, { title: 'Tab 2', name: 1, titleStyle: 'color: red;' }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    const style0 = headers[0].getAttribute('style') || '';
    expect(style0).toContain('font-weight');
  });

  it('should render correctly after inserting a tab', async () => {
    const showTab = ref(false);
    const { container } = render(
      defineComponent({
        setup() {
          return { showTab };
        },
        render() {
          const tabs = [
            h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Content 1' }),
          ];
          if (this.showTab) {
            tabs.push(h(Tab, { title: 'Tab 2', name: 1 }, { default: () => 'Content 2' }));
          }
          return h(Tabs, { active: 0 }, { default: () => tabs });
        },
      }),
    );
    await later();
    let headers = findTabHeaders(container);
    expect(headers.length).toBe(1);

    showTab.value = true;
    await later();
    headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
  });

  it('should render correctly after inserting a tab with name', async () => {
    const onChange = vi.fn();
    const showTab = ref(false);
    const { container } = render(
      defineComponent({
        setup() {
          return { showTab };
        },
        render() {
          const tabs = [
            h(Tab, { title: 'Tab A', name: 'a' }, { default: () => 'A' }),
          ];
          if (this.showTab) {
            tabs.push(h(Tab, { title: 'Tab B', name: 'b' }, { default: () => 'B' }));
          }
          return h(Tabs, { active: 'a', onChange }, { default: () => tabs });
        },
      }),
    );
    await later();

    // Inserting a tab should not trigger change event
    showTab.value = true;
    await later();
    expect(onChange).not.toHaveBeenCalled();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
  });

  it('should render Tab inside a component correctly', async () => {
    const Wrapper = defineComponent({
      render() {
        return h(Tab, { title: 'Wrapped', name: 0 }, { default: () => 'Wrapped Content' });
      },
    });

    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [h(Wrapper)],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(1);
  });

  it('should apply titleClass to tab title', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0, titleClass: 'custom-title' }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(1);
    expect(headers[0].getAttribute('class')).toContain('custom-title');
  });

  it('should use scroll-view for scrollable tabs', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0, swipeThreshold: 3 }, {
            default: () => Array.from({ length: 6 }, (_, i) =>
              h(Tab, { title: `Tab ${i}`, name: i }, { default: () => `Content ${i}` }),
            ),
          });
        },
      }),
    );
    await later();
    // When scrollable, nav should be a scroll-view
    const nav = container.querySelector('.van-tabs__nav--complete');
    expect(nav).toBeTruthy();
  });

  it('should default border to false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabs, { active: 0 }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => 'Text' }),
            ],
          });
        },
      }),
    );
    await later();
    const wrap = container.querySelector('.van-tabs__wrap');
    expect(wrap).toBeTruthy();
    // border defaults to false — no hairline class
    expect(wrap!.getAttribute('class')).not.toContain('van-hairline');
  });

  it('should re-render when line-width or line-height changed', async () => {
    const lineWidth = ref(40);
    const lineHeight = ref(3);
    const { container } = render(
      defineComponent({
        setup() {
          return { lineWidth, lineHeight };
        },
        render() {
          return h(Tabs, { active: 0, lineWidth: this.lineWidth, lineHeight: this.lineHeight }, {
            default: () => [
              h(Tab, { title: 'Tab 1', name: 0 }, { default: () => '1' }),
            ],
          });
        },
      }),
    );
    await later();
    const lineView = container.querySelector('.van-tabs__line');
    expect(lineView).toBeTruthy();
    let style = lineView!.getAttribute('style') || '';
    expect(style).toContain('width: 40px');
    expect(style).toContain('height: 3px');

    lineWidth.value = 20;
    lineHeight.value = 5;
    await later();
    style = lineView!.getAttribute('style') || '';
    expect(style).toContain('width: 20px');
    expect(style).toContain('height: 5px');
  });
});
