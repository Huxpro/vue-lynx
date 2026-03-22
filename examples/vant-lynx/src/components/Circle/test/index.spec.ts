import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Circle from '../index.vue';

describe('Circle', () => {
  // Vant test 1: should update to final rate immediately if speed is 0
  it('should update to final rate immediately if speed is 0', async () => {
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Circle, {
            rate: 50,
            currentRate: 0,
            'onUpdate:currentRate': (val: number) => updates.push(val),
          });
      },
    });

    render(Comp);
    await nextTick();
    expect(updates.length).toBeGreaterThan(0);
    expect(updates).toContain(50);
  });

  // Vant test 2: should emit update:currentRate during animation
  it('should emit update:currentRate event during animation', async () => {
    vi.useFakeTimers();
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Circle, {
            rate: 50,
            speed: 100,
            currentRate: 0,
            'onUpdate:currentRate': (val: number) => updates.push(val),
          });
      },
    });

    render(Comp);
    await nextTick();

    // Advance time to trigger animation
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(updates.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  // Vant test 3: should change circle size when using size prop
  it('should change circle size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { size: 100 });
        },
      }),
    );
    const circle = container.querySelector('.van-circle');
    expect(circle).toBeTruthy();
    const style = circle!.getAttribute('style') || '';
    expect(style).toContain('100px');
  });

  // Vant test 4: should render stroke-linecap prop
  it('should render stroke-linecap prop in SVG content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { strokeLinecap: 'square', currentRate: 50 });
        },
      }),
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const content = svg!.getAttribute('content') || '';
    expect(content).toContain('stroke-linecap: square');
  });

  // Vant test 5: should render start-position prop correctly
  it('should render start-position prop correctly', () => {
    // top position: no rotation
    const { container: c1 } = render(
      defineComponent({
        render() {
          return h(Circle, { startPosition: 'top', currentRate: 75 });
        },
      }),
    );
    const svg1 = c1.querySelector('svg');
    const content1 = svg1!.getAttribute('content') || '';
    expect(content1).not.toContain('rotate');

    // right position: rotate(90deg)
    const { container: c2 } = render(
      defineComponent({
        render() {
          return h(Circle, { startPosition: 'right', currentRate: 75 });
        },
      }),
    );
    const svg2 = c2.querySelector('svg');
    const content2 = svg2!.getAttribute('content') || '';
    expect(content2).toContain('rotate(90deg)');

    // bottom position: rotate(180deg)
    const { container: c3 } = render(
      defineComponent({
        render() {
          return h(Circle, { startPosition: 'bottom', currentRate: 75 });
        },
      }),
    );
    const svg3 = c3.querySelector('svg');
    const content3 = svg3!.getAttribute('content') || '';
    expect(content3).toContain('rotate(180deg)');

    // left position: rotate(270deg)
    const { container: c4 } = render(
      defineComponent({
        render() {
          return h(Circle, { startPosition: 'left', currentRate: 75 });
        },
      }),
    );
    const svg4 = c4.querySelector('svg');
    const content4 = svg4!.getAttribute('content') || '';
    expect(content4).toContain('rotate(270deg)');
  });

  // Additional: should render BEM class names
  it('should render BEM class names', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 70 });
        },
      }),
    );
    expect(container.querySelector('.van-circle')).toBeTruthy();
    expect(container.querySelector('.van-circle__text')).toBeTruthy();
  });

  // Additional: should render text prop
  it('should render text prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { text: '70%' });
        },
      }),
    );
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some((t: any) => t.textContent === '70%')).toBe(true);
  });

  // Additional: should render default slot
  it('should render default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 75 }, {
            default: () => h('text', null, 'Slot Content'),
          });
        },
      }),
    );
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some((t: any) => t.textContent === 'Slot Content')).toBe(true);
  });

  // Additional: should support custom color
  it('should support custom color in SVG content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, color: '#ee0a24' });
        },
      }),
    );
    const svg = container.querySelector('svg');
    const content = svg!.getAttribute('content') || '';
    expect(content).toContain('#ee0a24');
  });

  // Additional: should support gradient color
  it('should support gradient color in SVG content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, {
            currentRate: 50,
            color: { '0%': '#3fecff', '100%': '#6149f6' },
          });
        },
      }),
    );
    const svg = container.querySelector('svg');
    const content = svg!.getAttribute('content') || '';
    expect(content).toContain('linearGradient');
    expect(content).toContain('#3fecff');
    expect(content).toContain('#6149f6');
  });

  // Additional: should support layer color
  it('should support layer color in SVG content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, layerColor: '#ebedf0' });
        },
      }),
    );
    const svg = container.querySelector('svg');
    const content = svg!.getAttribute('content') || '';
    expect(content).toContain('#ebedf0');
  });

  // Additional: should support counter-clockwise
  it('should support counter-clockwise', () => {
    const { container: cw } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, clockwise: true });
        },
      }),
    );
    // Clockwise path uses sweepFlag 1
    const cwHtml = cw.innerHTML;
    expect(cwHtml).toContain('1, 1');

    const { container: ccw } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, clockwise: false });
        },
      }),
    );
    // Counter-clockwise path uses sweepFlag 0
    const ccwHtml = ccw.innerHTML;
    expect(ccwHtml).toContain('1, 0');
  });

  // Additional: should support string size prop
  it('should support string size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { size: '120px' });
        },
      }),
    );
    const circle = container.querySelector('.van-circle');
    const style = circle!.getAttribute('style') || '';
    expect(style).toContain('120px');
  });
});
