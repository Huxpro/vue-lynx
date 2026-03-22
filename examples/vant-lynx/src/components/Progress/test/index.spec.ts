import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Progress from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

describe('Progress', () => {
  // Vant test 1: should re-calc width if showing pivot dynamically
  it('should re-calc width if showing pivot dynamically', async () => {
    const showPivot = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Progress, {
            showPivot: showPivot.value,
            percentage: 100,
          });
      },
    });

    const { container } = render(Comp);

    // No pivot text when showPivot is false
    let texts = getTexts(container);
    expect(texts).not.toContain('100%');

    // Show pivot
    showPivot.value = true;
    await nextTick();
    texts = getTexts(container);
    expect(texts).toContain('100%');
  });

  // Vant test 2: should change track color when using track-color prop
  it('should change track color when using track-color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 0, trackColor: 'green' });
        },
      }),
    );
    const root = container.querySelector('.van-progress');
    expect(root).toBeTruthy();
    const style = root!.getAttribute('style') || '';
    expect(style).toContain('green');
  });

  // Vant test 3: should render pivot slot with correct percentage
  it('should render pivot slot with correct percentage', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 75 }, {
            pivot: ({ percentage }: { percentage: number }) =>
              h('text', null, `${percentage}% completed`),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('75% completed');
  });

  // Vant test 4: should render pivot slot instead of pivotText when both provided
  it('should render pivot slot instead of pivotText when both provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Progress,
            { percentage: 50, pivotText: 'prop text' },
            { pivot: () => h('text', null, 'slot content') },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('slot content');
    expect(texts).not.toContain('prop text');
  });

  // Vant test 5: should not render pivot slot when showPivot is false
  it('should not render pivot when showPivot is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Progress,
            { percentage: 50, showPivot: false },
            { pivot: () => h('text', null, 'slot content') },
          );
        },
      }),
    );
    const pivot = container.querySelector('.van-progress__pivot');
    expect(pivot).toBeNull();
  });

  // Additional: should render with BEM classes
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50 });
        },
      }),
    );
    expect(container.querySelector('.van-progress')).toBeTruthy();
    expect(container.querySelector('.van-progress__portion')).toBeTruthy();
    expect(container.querySelector('.van-progress__pivot')).toBeTruthy();
  });

  // Additional: should render percentage text
  it('should render percentage text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 70 });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('70%');
  });

  // Additional: should render custom pivotText
  it('should render custom pivotText', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, pivotText: 'Orange' });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Orange');
  });

  // Additional: should clamp percentage to 0-100
  it('should clamp percentage to 0-100', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 150 });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('100%');
  });

  // Additional: should apply inactive class
  it('should apply inactive class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, inactive: true });
        },
      }),
    );
    expect(container.querySelector('.van-progress__portion--inactive')).toBeTruthy();
    expect(container.querySelector('.van-progress__pivot--inactive')).toBeTruthy();
  });

  // Additional: should apply custom stroke width
  it('should apply custom stroke width', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, strokeWidth: 8 });
        },
      }),
    );
    const root = container.querySelector('.van-progress');
    const style = root!.getAttribute('style') || '';
    expect(style).toContain('8px');
  });

  // Additional: should apply custom color
  it('should apply custom color via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, color: '#ee0a24' });
        },
      }),
    );
    const portion = container.querySelector('.van-progress__portion');
    const style = portion!.getAttribute('style') || '';
    expect(style.includes('#ee0a24') || style.includes('rgb(238, 10, 36)')).toBe(true);
  });

  // Additional: should set portion width to percentage
  it('should set portion width to percentage', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 60 });
        },
      }),
    );
    const portion = container.querySelector('.van-progress__portion');
    const style = portion!.getAttribute('style') || '';
    expect(style).toContain('60%');
  });
});
