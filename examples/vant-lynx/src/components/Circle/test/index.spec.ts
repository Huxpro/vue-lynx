import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Circle from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

function getAllViews(container: any): any[] {
  return Array.from(container.querySelectorAll('view'));
}

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
    // Initially no updates (animation hasn't started yet beyond first tick)
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
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('100px'))).toBe(true);
  });

  // Vant test 4: should render text prop
  it('should render text prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { text: 'Custom' });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom');
  });

  // Vant test 5: should render default slot
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
    const texts = getTexts(container);
    expect(texts).toContain('Slot Content');
  });

  // Additional: should render circle
  it('should render circle', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 70 });
        },
      }),
    );
    const views = getAllViews(container);
    expect(views.length).toBeGreaterThan(0);
  });

  // Additional: should support custom color
  it('should support custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, color: '#ee0a24' });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(
      styles.some(
        (s: string) =>
          s.includes('#ee0a24') || s.includes('rgb(238, 10, 36)'),
      ),
    ).toBe(true);
  });

  // Additional: should support layer color
  it('should support layer color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, layerColor: '#ebedf0' });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(
      styles.some(
        (s: string) =>
          s.includes('#ebedf0') || s.includes('rgb(235, 237, 240)'),
      ),
    ).toBe(true);
  });

  // Additional: should support clockwise false
  it('should support counter-clockwise', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { currentRate: 50, clockwise: false });
        },
      }),
    );
    const views = getAllViews(container);
    expect(views.length).toBeGreaterThan(0);
  });

  // Additional: should support string size
  it('should support string size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Circle, { size: '120px' });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('120px'))).toBe(true);
  });
});
