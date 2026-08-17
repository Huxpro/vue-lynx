import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import RollingText from '../index.vue';

describe('RollingText', () => {
  it('should render rolling text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(RollingText, {
            startNum: 0,
            targetNum: 123,
            autoStart: false,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should display start number initially when autoStart is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(RollingText, {
            startNum: 0,
            targetNum: 100,
            autoStart: false,
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const digits = textEls.map((t) => t.textContent).join('');
    expect(digits).toContain('0');
  });

  it('should render correct number of digit columns', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(RollingText, {
            startNum: 0,
            targetNum: 9999,
            autoStart: false,
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    // 4 digits for 9999
    expect(textEls.length).toBeGreaterThanOrEqual(4);
  });

  it('should render with custom height', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(RollingText, {
            startNum: 0,
            targetNum: 50,
            height: 60,
            autoStart: false,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should handle single digit numbers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(RollingText, {
            startNum: 0,
            targetNum: 5,
            autoStart: false,
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(1);
  });
});
