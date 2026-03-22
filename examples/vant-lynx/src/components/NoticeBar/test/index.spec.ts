import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NoticeBar from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

function getAllViews(container: any): any[] {
  return Array.from(container.querySelectorAll('view'));
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

    // Find the right icon view (last view with cursor: pointer)
    const views = getAllViews(container);
    const rightIcon = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('cursor: pointer'),
    );
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

  // Vant test 3: should emit replay event after marquee cycle
  it('should emit replay event after marquee cycle', () => {
    const onReplay = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'A'.repeat(100), // Long text to trigger scrolling
            scrollable: true,
            delay: 0,
            speed: 60,
            onReplay,
          });
        },
      }),
    );

    // Advance past the delay (0ms) and enough frames for full scroll
    // Content width estimate: 100 chars * 8 = 800px
    // Speed: 60px/s, frame: ~0.96px/frame at 16ms
    // Frames needed: 800 / 0.96 ≈ 834 frames = 834 * 16ms ≈ 13344ms
    vi.advanceTimersByTime(15000);

    expect(onReplay).toHaveBeenCalled();
  });

  // Vant test 4: should start scrolling when content is longer than wrap
  it('should start scrolling when content overflows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            // 100 chars * 8px = 800px > 300px WRAP_WIDTH -> should scroll
            text: 'A'.repeat(100),
            delay: 0,
          });
        },
      }),
    );

    // After delay + some frames, offset should change
    vi.advanceTimersByTime(100);

    const views = getAllViews(container);
    const contentView = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('position: absolute'),
    );
    expect(contentView).toBeTruthy();
  });

  // Vant test 5: should not scroll when content fits
  it('should not scroll when content fits within wrap', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            // 5 chars * 8px = 40px < 300px WRAP_WIDTH -> should not scroll
            text: 'Short',
            delay: 0,
          });
        },
      }),
    );

    vi.advanceTimersByTime(100);

    const views = getAllViews(container);
    // Content should be relative positioned (ellipsis mode), not absolute
    const absoluteContent = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('position: absolute'),
    );
    expect(absoluteContent).toBeFalsy();
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
    let texts = getTexts(container);
    expect(texts).toContain('Closeable');

    // Tap close icon
    const views = getAllViews(container);
    const rightIcon = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('cursor: pointer'),
    );
    fireEvent.tap(rightIcon!);
    await nextTick();

    // Bar should be hidden (removed from DOM via v-if)
    texts = getTexts(container);
    expect(texts).not.toContain('Closeable');
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
    // Should have right icon view
    const views = getAllViews(container);
    const rightIcon = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('cursor: pointer'),
    );
    expect(rightIcon).toBeTruthy();
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
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(
      styles.some(
        (s: string) =>
          s.includes('#ecf9ff') || s.includes('rgb(236, 249, 255)'),
      ),
    ).toBe(true);
  });

  // Additional: should render left icon
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
    const views = getAllViews(container);
    // Should have at least the bar + left icon view + wrap + content
    expect(views.length).toBeGreaterThan(2);
  });

  // Additional: should force scroll with scrollable=true even for short text
  it('should force scroll with scrollable=true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Hi',
            scrollable: true,
            delay: 0,
          });
        },
      }),
    );

    const views = getAllViews(container);
    const absoluteContent = views.find(
      (v: any) =>
        (v.getAttribute('style') || '').includes('position: absolute'),
    );
    expect(absoluteContent).toBeTruthy();
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
