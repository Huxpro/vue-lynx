import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NavBar from '../index.vue';

describe('NavBar', () => {
  it('should render title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Page Title' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Page Title',
    );
    expect(hasTitle).toBe(true);
  });

  it('should render left text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftText: 'Back' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasLeftText = Array.from(textEls).some(
      (t) => t.textContent === 'Back',
    );
    expect(hasLeftText).toBe(true);
  });

  it('should render right text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', rightText: 'Button' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasRightText = Array.from(textEls).some(
      (t) => t.textContent === 'Button',
    );
    expect(hasRightText).toBe(true);
  });

  it('should render left arrow', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftArrow: true });
        },
      }),
    );
    // Icon component renders vant-icon font char '\ue668' for arrow-left
    const textEls = container.querySelectorAll('text');
    const hasArrow = Array.from(textEls).some(
      (t) => t.textContent === '\ue668',
    );
    expect(hasArrow).toBe(true);
  });

  it('should emit click-left event', async () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            leftArrow: true,
            'onClickLeft': (e: any) => clicks.push(e),
          });
        },
      }),
    );
    // Left area is the first nested view with tap handler
    const views = container.querySelectorAll('view');
    // Find the left area view (first child of navbar with left content)
    let leftView: Element | null = null;
    for (const v of Array.from(views)) {
      const style = v.getAttribute('style') || '';
      if (style.includes('padding-left: 16px') && style.includes('flex-direction: row')) {
        leftView = v;
        break;
      }
    }
    expect(leftView).not.toBeNull();
    fireEvent.tap(leftView!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should emit click-right event', async () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            rightText: 'Button',
            'onClickRight': (e: any) => clicks.push(e),
          });
        },
      }),
    );
    // Right area is the last child view with justify-content: flex-end
    const views = container.querySelectorAll('view');
    let rightView: Element | null = null;
    for (const v of Array.from(views)) {
      const style = v.getAttribute('style') || '';
      if (style.includes('padding-left: 16px') && style.includes('flex-direction: row')) {
        rightView = v;
      }
    }
    expect(rightView).not.toBeNull();
    fireEvent.tap(rightView!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should not emit click-left when left-disabled', async () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            leftArrow: true,
            leftDisabled: true,
            'onClickLeft': (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    let leftView: Element | null = null;
    for (const v of Array.from(views)) {
      const style = v.getAttribute('style') || '';
      if (style.includes('opacity: 0.6')) {
        leftView = v;
        break;
      }
    }
    expect(leftView).not.toBeNull();
    fireEvent.tap(leftView!);
    await nextTick();
    expect(clicks.length).toBe(0);
  });

  it('should not emit click-right when right-disabled', async () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            rightText: 'Button',
            rightDisabled: true,
            'onClickRight': (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    let rightView: Element | null = null;
    for (const v of Array.from(views)) {
      const style = v.getAttribute('style') || '';
      if (style.includes('opacity: 0.6')) {
        rightView = v;
        break;
      }
    }
    expect(rightView).not.toBeNull();
    fireEvent.tap(rightView!);
    await nextTick();
    expect(clicks.length).toBe(0);
  });

  it('should render border by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('border-bottom-width: 0.5px');
  });

  it('should hide border when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', border: false });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).not.toContain('border-bottom-width');
  });

  it('should render fixed style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', fixed: true });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('position: fixed');
  });

  it('should render placeholder when fixed and placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', fixed: true, placeholder: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // First view is the placeholder wrapper
    const placeholderView = views[0];
    const style = placeholderView!.getAttribute('style') || '';
    expect(style).toContain('height: 46px');
  });

  it('should render custom zIndex', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', zIndex: 100 });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('z-index: 100');
  });

  it('should render title slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, null, {
            title: () => h('text', {}, 'Custom Title'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Title',
    );
    expect(hasCustomTitle).toBe(true);
  });

  it('should render left slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' }, {
            left: () => h('text', {}, 'Custom Left'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomLeft = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Left',
    );
    expect(hasCustomLeft).toBe(true);
  });

  it('should render right slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' }, {
            right: () => h('text', {}, 'Custom Right'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomRight = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Right',
    );
    expect(hasCustomRight).toBe(true);
  });

  it('should not render left area when no left content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' });
        },
      }),
    );
    // Only the root view and the title wrapper view should exist
    const views = container.querySelectorAll('view');
    // Should not have any view with left padding style that contains arrow/text
    const leftViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-left: 16px') && style.includes('flex-direction: row');
    });
    expect(leftViews.length).toBe(0);
  });

  it('should not render right area when no right content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftArrow: true });
        },
      }),
    );
    // Left area should exist but not right area
    const views = container.querySelectorAll('view');
    const sideViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-left: 16px') && style.includes('flex-direction: row');
    });
    // Only left area
    expect(sideViews.length).toBe(1);
  });

  it('should apply safe area inset top padding', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', safeAreaInsetTop: true });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('padding-top: 44px');
  });

  it('should render disabled left with reduced opacity', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            leftArrow: true,
            leftDisabled: true,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const disabledViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('opacity: 0.6');
    });
    expect(disabledViews.length).toBeGreaterThan(0);
  });
});
