import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NoticeBar from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

describe('NoticeBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Vant test 1: should emit close event when close icon is clicked
  it('should emit close event when close icon is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            mode: 'closeable',
            text: 'Closeable notice',
            onClose,
          });
        },
      }),
    );

    const rightIcon = container.querySelector('.van-notice-bar__right-icon');
    expect(rightIcon).toBeTruthy();

    fireEvent.tap(rightIcon!);
    expect(onClose).toHaveBeenCalled();
  });

  // Vant test 2: should render icon slot correctly
  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            NoticeBar,
            { text: 'Content' },
            {
              'left-icon': () => h('text', null, 'Custom Left Icon'),
              'right-icon': () => h('text', null, 'Custom Right Icon'),
            },
          );
        },
      }),
    );

    const texts = getTexts(container);
    expect(texts).toContain('Custom Left Icon');
    expect(texts).toContain('Custom Right Icon');
    expect(texts).toContain('Content');
  });

  // Vant test 3: should set up transition for marquee scrolling
  // Note: transitionend event can't be dispatched in vue-lynx test env;
  // we verify the transition CSS properties are correctly applied instead
  it('should set up CSS transition for marquee', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'A'.repeat(100),
            scrollable: true,
            delay: 0,
            speed: 60,
          });
        },
      }),
    );

    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    await nextTick();

    const content = container.querySelector('.van-notice-bar__content');
    expect(content).toBeTruthy();

    const style = content!.getAttribute('style') || '';
    // Should have translateX for position and transitionDuration for speed
    expect(style).toContain('translateX');
    expect(style).toContain('transition-duration');
  });

  // Vant test 4: should start scrolling when content width > wrap width
  it('should start scrolling when content overflows', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'A'.repeat(100),
            delay: 0,
          });
        },
      }),
    );

    const wrap = container.querySelector('.van-notice-bar__wrap');
    const content = container.querySelector('.van-notice-bar__content');

    // Mock getBoundingClientRect
    if (wrap) {
      (wrap as any).getBoundingClientRect = () => ({ width: 50 } as DOMRect);
    }
    if (content) {
      (content as any).getBoundingClientRect = () => ({ width: 100 } as DOMRect);
    }

    // Process delay=0 setTimeout, then two nested setTimeout(0) for doubleRaf
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    await nextTick();

    const style = content?.getAttribute('style') || '';
    expect(style).toContain('translateX');
  });

  // Vant test 5: should not start scrolling when content fits
  it('should not scroll when content fits within wrap', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            // Very short text: 5 chars * 8px = 40px < 300px
            text: 'Short',
            delay: 0,
          });
        },
      }),
    );

    const content = container.querySelector('.van-notice-bar__content');

    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    vi.runOnlyPendingTimers();
    await nextTick();

    const style = content?.getAttribute('style') || '';
    expect(style).not.toContain('translateX');
  });

  // Vant test 6: should expose reset method
  it('should expose reset method', () => {
    let noticeBarRef: any = null;
    render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Test',
            ref: (el: any) => {
              noticeBarRef = el;
            },
          });
        },
      }),
    );

    expect(noticeBarRef).toBeTruthy();
    expect(typeof noticeBarRef.reset).toBe('function');
  });

  // Additional: should render notice bar with text
  it('should render notice bar with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, { text: 'Important notice' });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Important notice');
  });

  // Additional: should hide bar when close icon is tapped
  it('should hide bar when close icon is tapped', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            mode: 'closeable',
            text: 'Closeable',
          });
        },
      }),
    );

    // Bar should be visible initially
    expect(container.querySelector('.van-notice-bar')).toBeTruthy();

    const rightIcon = container.querySelector('.van-notice-bar__right-icon');
    fireEvent.tap(rightIcon!);
    await nextTick();

    // Bar should be hidden (removed from DOM via v-if)
    expect(container.querySelector('.van-notice-bar')).toBeFalsy();
  });

  // Additional: should render link mode with arrow icon
  it('should render link mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Link notice',
            mode: 'link',
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Link notice');
    expect(container.querySelector('.van-notice-bar__right-icon')).toBeTruthy();
  });

  // Additional: should apply custom color and background
  it('should apply custom color and background', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Custom',
            color: '#1989fa',
            background: '#ecf9ff',
          });
        },
      }),
    );
    const bar = container.querySelector('.van-notice-bar');
    const style = bar?.getAttribute('style') || '';
    // Test env may normalize hex to rgb
    expect(
      style.includes('#1989fa') || style.includes('rgb(25, 137, 250)'),
    ).toBe(true);
    expect(
      style.includes('#ecf9ff') || style.includes('rgb(236, 249, 255)'),
    ).toBe(true);
  });

  // Additional: should render left icon when leftIcon prop is set
  it('should render left icon when leftIcon prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'With icon',
            leftIcon: 'volume-o',
          });
        },
      }),
    );
    expect(container.querySelector('.van-notice-bar__left-icon')).toBeTruthy();
  });

  // Additional: should render with BEM classes
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, { text: 'Test' });
        },
      }),
    );
    expect(container.querySelector('.van-notice-bar')).toBeTruthy();
    expect(container.querySelector('.van-notice-bar__wrap')).toBeTruthy();
    expect(container.querySelector('.van-notice-bar__content')).toBeTruthy();
  });

  // Additional: should apply wrapable class
  it('should apply wrapable class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Wrapable text',
            wrapable: true,
            scrollable: false,
          });
        },
      }),
    );
    expect(container.querySelector('.van-notice-bar--wrapable')).toBeTruthy();
  });

  // Additional: should apply ellipsis class when scrollable=false and not wrapable
  it('should apply ellipsis class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Some text',
            scrollable: false,
          });
        },
      }),
    );
    expect(container.querySelector('.van-ellipsis')).toBeTruthy();
  });

  // Additional: should render default slot content
  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            NoticeBar,
            { scrollable: false },
            { default: () => h('text', null, 'Slot Content') },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Slot Content');
  });
});
