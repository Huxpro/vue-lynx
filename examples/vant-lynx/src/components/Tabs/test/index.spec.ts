import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabs from '../index.vue';
import Tab from '../../Tab/index.vue';

/**
 * Helper: find tab header views (the clickable tab title wrappers).
 * Tab headers are rendered inside the nav bar and have cursor: pointer or cursor: default (disabled).
 */
function findTabHeaders(container: any): any[] {
  const views = container.querySelectorAll('view');
  return Array.from(views).filter((v: any) => {
    const style = v.getAttribute('style') || '';
    return (
      (style.includes('cursor: pointer') || style.includes('cursor: default')) &&
      style.includes('justify-content: center') &&
      style.includes('align-items: center')
    );
  });
}

/**
 * Helper: wait for tabs to initialize (children register async via nextTick)
 */
async function later(ms = 0) {
  await nextTick();
  await nextTick();
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

describe('Tabs', () => {
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
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(2);
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
    const views = container.querySelectorAll('view');
    const lineView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: absolute') && style.includes('bottom: 0px');
    });
    expect(lineView).toBeTruthy();
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
    // Card style should have border around nav
    const views = container.querySelectorAll('view');
    const navView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-style: solid') && style.includes('border-radius: 2px');
    });
    expect(navView).toBeTruthy();
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
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(3);
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
    const views = container.querySelectorAll('view');
    const badgeViews = Array.from(views).filter((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color: rgb(238, 10, 36)') && style.includes('border-radius: 8px');
    });
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
    // Dot is an 8x8 red circle
    const views = container.querySelectorAll('view');
    const dotView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('width: 8px') && style.includes('height: 8px') &&
        style.includes('border-radius: 4px') && style.includes('background-color: rgb(238, 10, 36)');
    });
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
    // Check that wrap view has border-bottom
    const views = container.querySelectorAll('view');
    const wrapView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-bottom-width: 0.5px') && style.includes('overflow: hidden');
    });
    expect(wrapView).toBeTruthy();
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
    // Wrap view should NOT have border-bottom
    const views = container.querySelectorAll('view');
    const wrapView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('overflow: hidden') && !style.includes('border-bottom');
    });
    expect(wrapView).toBeTruthy();
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

    // Second tab's content should now be visible
    const views = container.querySelectorAll('view');
    const visibleContentViews = Array.from(views).filter((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('display: flex') && style.includes('flex-direction: column') && !style.includes('display: none');
    });
    expect(visibleContentViews.length).toBeGreaterThan(0);
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
    const views = container.querySelectorAll('view');
    const lineView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: absolute') && style.includes('bottom: 0px') &&
        style.includes('background-color: rgb(238, 10, 36)');
    });
    expect(lineView).toBeTruthy();
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
    expect(activeStyle).toContain('background-color: rgb(238, 10, 36)');
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
    const texts = container.querySelectorAll('text');
    const activeText = Array.from(texts).find((t: any) => t.textContent === 'Active');
    const inactiveText = Array.from(texts).find((t: any) => t.textContent === 'Inactive');
    expect(activeText?.getAttribute('style')).toContain('color: rgb(238, 10, 36)');
    expect(inactiveText?.getAttribute('style')).toContain('color: rgb(7, 193, 96)');
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
    // In shrink mode, tab headers should not have flex: 1
    const headers = findTabHeaders(container);
    expect(headers.length).toBe(2);
    // Shrink mode tabs should have padding but no flex: 1 explicitly
    const style = headers[0].getAttribute('style') || '';
    expect(style).toContain('padding-left: 12px');
    expect(style).toContain('padding-right: 12px');
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
    // Find the line indicator
    const views = container.querySelectorAll('view');
    const lineView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: absolute') && style.includes('bottom: 0px');
    });
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
    // Nav should have custom background
    const views = container.querySelectorAll('view');
    const navView = Array.from(views).find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color: rgb(242, 243, 245)') && style.includes('flex-direction: row');
    });
    expect(navView).toBeTruthy();
  });

  it('should disabled tab have reduced opacity', async () => {
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
    const disabledStyle = headers[1].getAttribute('style') || '';
    expect(disabledStyle).toContain('opacity: 0.5');
    expect(disabledStyle).toContain('cursor: default');
  });
});
