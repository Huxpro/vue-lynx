import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Skeleton from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

function getAllViews(container: any): any[] {
  return Array.from(container.querySelectorAll('view'));
}

describe('Skeleton', () => {
  // Vant test 1: should render with row width array correctly
  it('should render with row width array correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, {
            row: 4,
            rowWidth: ['100%', 30, '5rem'],
          });
        },
      }),
    );
    const views = getAllViews(container);
    // Should have rows rendered
    expect(views.length).toBeGreaterThan(3);

    // Check that row widths are applied
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('100%'))).toBe(true);
    expect(styles.some((s: string) => s.includes('30px'))).toBe(true);
    expect(styles.some((s: string) => s.includes('5rem'))).toBe(true);
  });

  // Vant test 2: should render default slot when loading is false
  it('should render default slot when loading is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Skeleton,
            { loading: false },
            { default: () => h('text', null, 'Content') },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Content');
  });

  // Vant test 3: should change avatar size when using avatar-size prop
  it('should change avatar size when using avatar-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, avatarSize: '20rem' });
        },
      }),
    );
    const views = getAllViews(container);
    const avatarStyles = views.map((v: any) => v.getAttribute('style') || '');
    expect(avatarStyles.some((s: string) => s.includes('20rem'))).toBe(true);
  });

  // Vant test 4: should change avatar shape when using avatar-shape prop
  it('should change avatar shape when using avatar-shape prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, avatarShape: 'square' });
        },
      }),
    );
    const views = getAllViews(container);
    const avatarStyles = views.map((v: any) => v.getAttribute('style') || '');
    // Square avatars should have 0px border-radius, not 999px
    expect(
      avatarStyles.some(
        (s: string) =>
          s.includes('border-radius: 0px') || s.includes('border-radius:0px'),
      ),
    ).toBe(true);
  });

  // Vant test 5: should be round when using round prop
  it('should be round when using round prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { title: true, round: true, avatar: true });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    // Title/rows should have 999px border-radius
    expect(styles.some((s: string) => s.includes('999px'))).toBe(true);
  });

  // Vant test 6: should Skeleton works with template slots
  it('should Skeleton works with template slots', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, null, {
            template: () => h('text', null, 'custom content'),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('custom content');
  });

  // Vant test 7: should allow to disable animation
  it('should allow to disable animation', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 1, animate: false });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    // With animate: false, opacity should be 1
    const rowViews = views.filter(
      (v: any) =>
        (v.getAttribute('style') || '').includes('background-color') &&
        (v.getAttribute('style') || '').includes('height: 16px'),
    );
    for (const rv of rowViews) {
      const style = rv.getAttribute('style') || '';
      expect(style).toContain('opacity: 1');
    }
  });

  // Additional: should render skeleton with rows
  it('should render skeleton with rows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 3, loading: true });
        },
      }),
    );
    const views = getAllViews(container);
    expect(views.length).toBeGreaterThan(0);
  });

  // Additional: should render title placeholder
  it('should render title placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { title: true, row: 2, loading: true });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    // Title has width: 40%
    expect(styles.some((s: string) => s.includes('40%'))).toBe(true);
  });

  // Additional: should hide slot content when loading
  it('should hide slot content when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Skeleton,
            { row: 3, loading: true },
            { default: () => h('text', null, 'Loaded content') },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).not.toContain('Loaded content');
  });

  // Additional: should use default last row width of 60%
  it('should use default last row width of 60%', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 3 });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('60%'))).toBe(true);
  });

  // Additional: should support numeric avatarSize
  it('should support numeric avatarSize', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, avatarSize: 48 });
        },
      }),
    );
    const views = getAllViews(container);
    const styles = views.map((v: any) => v.getAttribute('style') || '');
    expect(styles.some((s: string) => s.includes('48px'))).toBe(true);
  });
});
