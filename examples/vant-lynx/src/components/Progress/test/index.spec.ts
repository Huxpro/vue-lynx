import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Progress from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

function getAllViews(container: any): any[] {
  return Array.from(container.querySelectorAll('view'));
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
    const views = getAllViews(container);
    const trackStyles = views.map((v: any) => v.getAttribute('style') || '');
    expect(trackStyles.some((s: string) => s.includes('green'))).toBe(true);
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
  it('should not render pivot slot when showPivot is false', () => {
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
    const texts = getTexts(container);
    expect(texts).not.toContain('slot content');
  });

  // Additional: should render progress bar
  it('should render progress bar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50 });
        },
      }),
    );
    const views = getAllViews(container);
    expect(views.length).toBeGreaterThan(0);
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

  // Additional: should apply inactive color
  it('should apply inactive color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, inactive: true });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    // Inactive uses #c8c9cc
    expect(
      styles.some((s: string) => s.includes('rgb(200, 201, 204)') || s.includes('#c8c9cc')),
    ).toBe(true);
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
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('8'))).toBe(true);
  });

  // Additional: should apply custom color
  it('should apply custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Progress, { percentage: 50, color: '#ee0a24' });
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
});
