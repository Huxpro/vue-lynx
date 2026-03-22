import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Loading from '../index.vue';

// Helper to find the styled text element (the one with font-size style)
function findStyledText(container: any): Element | undefined {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((el: any) => {
    const style = el.getAttribute('style');
    return style && style.includes('font-size');
  }) as Element | undefined;
}

describe('Loading', () => {
  it('should render circular loading by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render spinner loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { type: 'spinner' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should change loading size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { size: 20 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const spinnerView = views[1];
    expect(spinnerView).toBeTruthy();
    const style = spinnerView.getAttribute('style') || '';
    expect(style).toContain('20px');
  });

  it('should change text font-size when using text-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { textSize: 20 }, { default: () => 'Text' });
        },
      }),
    );
    const styledText = findStyledText(container);
    expect(styledText).toBeTruthy();
    const style = styledText!.getAttribute('style')!;
    expect(style).toContain('20px');
  });

  it('should change text color when using text-color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { textColor: 'red' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const styledText = findStyledText(container);
    expect(styledText).toBeTruthy();
    const style = styledText!.getAttribute('style')!;
    expect(style).toContain('red');
  });

  it('should change text color when using color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { color: 'green' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const styledText = findStyledText(container);
    expect(styledText).toBeTruthy();
    const style = styledText!.getAttribute('style')!;
    expect(style).toContain('green');
  });

  it('should change text color to textColor when using color & textColor prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { color: 'green', textColor: 'red' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const styledText = findStyledText(container);
    expect(styledText).toBeTruthy();
    const style = styledText!.getAttribute('style')!;
    expect(style).toContain('red');
    expect(style).not.toContain('green');
  });

  it('should render vertical loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { vertical: true },
            { default: () => 'Loading...' },
          );
        },
      }),
    );
    const containerView = container.querySelector('view');
    expect(containerView).toBeTruthy();
    const style = containerView!.getAttribute('style') || '';
    expect(style).toContain('column');
  });

  it('should render icon slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, null, {
            icon: () => h('text', {}, 'Custom Icon'),
            default: () => 'Loading...',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const iconText = Array.from(textEls).find(
      (t: any) => t.textContent === 'Custom Icon',
    );
    expect(iconText).toBeTruthy();
  });
});
