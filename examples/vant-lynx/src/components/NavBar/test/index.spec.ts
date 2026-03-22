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

  it('should render van-nav-bar class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' });
        },
      }),
    );
    const el = container.querySelector('.van-nav-bar');
    expect(el).not.toBeNull();
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
    // Icon renders vant-icon font char '\ue668' for arrow-left
    const textEls = container.querySelectorAll('text');
    const hasArrow = Array.from(textEls).some(
      (t) => t.textContent === '\ue668',
    );
    expect(hasArrow).toBe(true);
  });

  it('should render left area with van-nav-bar__left class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftArrow: true });
        },
      }),
    );
    const leftEl = container.querySelector('.van-nav-bar__left');
    expect(leftEl).not.toBeNull();
  });

  it('should render right area with van-nav-bar__right class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', rightText: 'Button' });
        },
      }),
    );
    const rightEl = container.querySelector('.van-nav-bar__right');
    expect(rightEl).not.toBeNull();
  });

  it('should render content area with van-nav-bar__content class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' });
        },
      }),
    );
    const contentEl = container.querySelector('.van-nav-bar__content');
    expect(contentEl).not.toBeNull();
  });

  it('should render text elements with van-nav-bar__text class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftText: 'Back', rightText: 'Btn' });
        },
      }),
    );
    const textEls = container.querySelectorAll('.van-nav-bar__text');
    expect(textEls.length).toBe(2);
  });

  it('should emit click-left event', async () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, {
            title: 'Title',
            leftArrow: true,
            onClickLeft: (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const leftView = container.querySelector('.van-nav-bar__left');
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
            onClickRight: (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const rightView = container.querySelector('.van-nav-bar__right');
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
            onClickLeft: (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const leftView = container.querySelector('.van-nav-bar__left');
    expect(leftView).not.toBeNull();
    expect(leftView!.className).toContain('van-nav-bar__left--disabled');
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
            onClickRight: (e: any) => clicks.push(e),
          });
        },
      }),
    );
    const rightView = container.querySelector('.van-nav-bar__right');
    expect(rightView).not.toBeNull();
    expect(rightView!.className).toContain('van-nav-bar__right--disabled');
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
    const rootEl = container.querySelector('.van-nav-bar');
    expect(rootEl!.className).toContain('van-hairline--bottom');
  });

  it('should hide border when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', border: false });
        },
      }),
    );
    const rootEl = container.querySelector('.van-nav-bar');
    expect(rootEl!.className).not.toContain('van-hairline--bottom');
  });

  it('should render fixed class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', fixed: true });
        },
      }),
    );
    const rootEl = container.querySelector('.van-nav-bar');
    expect(rootEl!.className).toContain('van-nav-bar--fixed');
  });

  it('should render placeholder when fixed and placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', fixed: true, placeholder: true });
        },
      }),
    );
    const placeholder = container.querySelector('.van-nav-bar__placeholder');
    expect(placeholder).not.toBeNull();
    const navbar = container.querySelector('.van-nav-bar--fixed');
    expect(navbar).not.toBeNull();
  });

  it('should render custom zIndex', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', zIndex: 100 });
        },
      }),
    );
    const rootEl = container.querySelector('.van-nav-bar');
    const style = rootEl!.getAttribute('style') || '';
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
    const leftEl = container.querySelector('.van-nav-bar__left');
    expect(leftEl).toBeNull();
  });

  it('should not render right area when no right content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftArrow: true });
        },
      }),
    );
    const leftEl = container.querySelector('.van-nav-bar__left');
    expect(leftEl).not.toBeNull();
    const rightEl = container.querySelector('.van-nav-bar__right');
    expect(rightEl).toBeNull();
  });

  it('should apply safe-area-top class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', safeAreaInsetTop: true });
        },
      }),
    );
    const rootEl = container.querySelector('.van-nav-bar');
    expect(rootEl!.className).toContain('van-safe-area-top');
  });

  it('should render arrow with van-nav-bar__arrow class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title', leftArrow: true });
        },
      }),
    );
    const arrowEl = container.querySelector('.van-nav-bar__arrow');
    expect(arrowEl).not.toBeNull();
  });

  it('should render title with van-nav-bar__title class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NavBar, { title: 'Title' });
        },
      }),
    );
    const titleEl = container.querySelector('.van-nav-bar__title');
    expect(titleEl).not.toBeNull();
  });
});
