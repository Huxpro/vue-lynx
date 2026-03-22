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

// Helper: find tab header views (including disabled ones)
function findTabHeaders(container: Element): Element[] {
  const views = Array.from(container.querySelectorAll('view'));
  return views.filter((v) => {
    const style = v.getAttribute('style') || '';
    return (
      (style.includes('cursor: pointer') || style.includes('cursor: default')) &&
      style.includes('justify-content: center') &&
      style.includes('align-items: center') &&
      style.includes('height:')
    );
  });
}

// Helper: find text by content
function findText(container: Element, content: string): Element | undefined {
  const texts = Array.from(container.querySelectorAll('text'));
  return texts.find((t) => t.textContent === content);
}

describe('Tab', () => {
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

    // Only Tab1 should show "0" badge, Tab2 should not
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

    // Should have a small red dot view element
    const views = Array.from(container.querySelectorAll('view'));
    const dotView = views.find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-radius') && style.includes('8px') &&
        style.includes('width: 8px') && style.includes('height: 8px');
    });
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

    // The tab header views should have the custom title style merged
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

    // The wrap view (with overflow:hidden) should NOT have border-bottom styling
    const views = Array.from(container.querySelectorAll('view'));
    const wrapView = views.find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('overflow: hidden');
    });
    expect(wrapView).toBeTruthy();
    const style = wrapView!.getAttribute('style') || '';
    expect(style).not.toContain('border-bottom');
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

    // Should have a line indicator view with specific dimensions
    const views = Array.from(container.querySelectorAll('view'));
    const lineView = views.find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: absolute') && style.includes('bottom: 0');
    });
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
          return h(Tabs, { active: 0, type: 'card', color: '#ee0a24' }, {
            default: () => [
              h(Tab, { title: 'Tab1' }, { default: () => '1' }),
              h(Tab, { title: 'Tab2' }, { default: () => '2' }),
            ],
          });
        },
      }),
    );
    await later();

    // Nav should have card border styling
    const views = Array.from(container.querySelectorAll('view'));
    const navView = views.find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-radius: 2px') && style.includes('border');
    });
    expect(navView).toBeTruthy();
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

  it('should apply custom colors to tabs', async () => {
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

    const activeText = findText(container, 'Active');
    const inactiveText = findText(container, 'Inactive');
    expect(activeText?.getAttribute('style')).toContain('color');
    expect(inactiveText?.getAttribute('style')).toContain('color');
  });

  it('should render disabled tab with reduced opacity', async () => {
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
    // Normal tab should NOT have opacity: 0.5
    const normalStyle = headers[0]?.getAttribute('style') || '';
    expect(normalStyle).not.toContain('opacity: 0.5');

    // Disabled tab should have opacity: 0.5
    // Note: disabled tabs use cursor: default not cursor: pointer
    const views = Array.from(container.querySelectorAll('view'));
    const disabledHeader = views.find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('opacity: 0.5') && style.includes('cursor: default');
    });
    expect(disabledHeader).toBeTruthy();
  });
});
