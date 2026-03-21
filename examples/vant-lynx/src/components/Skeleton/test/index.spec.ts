import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Skeleton from '../index.vue';

describe('Skeleton', () => {
  it('should render skeleton with rows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 3, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render title placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { title: true, row: 2, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // container > content > title + 2 rows = at least 4 views
    expect(views.length).toBeGreaterThanOrEqual(4);
  });

  it('should render avatar placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, row: 2, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // container + avatar + content + 2 rows = at least 4 views
    expect(views.length).toBeGreaterThanOrEqual(4);
  });

  it('should render square avatar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, avatarShape: 'square', row: 1, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render custom avatar size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true, avatarSize: 48, row: 1, loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should show slot content when not loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Skeleton,
            { row: 3, loading: false },
            {
              default: () => h('text', null, 'Loaded content'),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Loaded content',
    );
    expect(hasContent).toBe(true);
  });

  it('should hide slot content when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Skeleton,
            { row: 3, loading: true },
            {
              default: () => h('text', null, 'Loaded content'),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Loaded content',
    );
    expect(hasContent).toBe(false);
  });

  it('should render with custom row widths array', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 3, rowWidth: ['100%', '80%', '60%'], loading: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
