import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Skeleton from '../index.vue';
import SkeletonAvatar from '../SkeletonAvatar.vue';
import SkeletonTitle from '../SkeletonTitle.vue';
import SkeletonParagraph from '../SkeletonParagraph.vue';
import SkeletonImage from '../SkeletonImage.vue';

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
    const paragraphs = container.querySelectorAll('.van-skeleton-paragraph');
    expect(paragraphs.length).toBe(4);
    // First row: 100%
    expect(paragraphs[0].getAttribute('style')).toContain('100%');
    // Second row: 30px (numeric converted)
    expect(paragraphs[1].getAttribute('style')).toContain('30px');
    // Third row: 5rem
    expect(paragraphs[2].getAttribute('style')).toContain('5rem');
    // Fourth row: no entry in array, so no width style (uses CSS default 100%)
    const fourthStyle = paragraphs[3].getAttribute('style') || '';
    expect(fourthStyle === '' || fourthStyle.includes('100%')).toBe(true);
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
    const texts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent || '',
    );
    expect(texts).toContain('Content');
    // Skeleton should not be rendered
    expect(container.querySelector('.van-skeleton')).toBeNull();
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
    const avatar = container.querySelector('.van-skeleton-avatar');
    expect(avatar).not.toBeNull();
    const style = avatar!.getAttribute('style') || '';
    expect(style).toContain('20rem');
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
    const avatar = container.querySelector('.van-skeleton-avatar');
    expect(avatar).not.toBeNull();
    const cls = avatar!.getAttribute('class') || '';
    expect(cls).toContain('van-skeleton-avatar--square');
    expect(cls).not.toContain('van-skeleton-avatar--round');
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
    expect(container.querySelector('.van-skeleton--round')).not.toBeNull();
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
    const texts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent || '',
    );
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
    expect(container.querySelector('.van-skeleton--animate')).toBeNull();
  });

  it('should have animate class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 1 });
        },
      }),
    );
    expect(container.querySelector('.van-skeleton--animate')).not.toBeNull();
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
    const paragraphs = container.querySelectorAll('.van-skeleton-paragraph');
    expect(paragraphs.length).toBe(3);
  });

  // Additional: should render title placeholder
  it('should render title placeholder', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { title: true, row: 2 });
        },
      }),
    );
    expect(container.querySelector('.van-skeleton-title')).not.toBeNull();
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
    const texts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent || '',
    );
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
    const paragraphs = container.querySelectorAll('.van-skeleton-paragraph');
    const lastRow = paragraphs[paragraphs.length - 1];
    expect(lastRow.getAttribute('style')).toContain('60%');
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
    const avatar = container.querySelector('.van-skeleton-avatar');
    expect(avatar!.getAttribute('style')).toContain('48px');
  });

  // Additional: round prop adds --round class to title
  it('should add round class to title when round prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { title: true, round: true, row: 1 });
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-title--round'),
    ).not.toBeNull();
    expect(
      container.querySelector('.van-skeleton-paragraph--round'),
    ).not.toBeNull();
  });

  // Additional: BEM class on skeleton root
  it('should have van-skeleton class on root element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 1 });
        },
      }),
    );
    expect(container.querySelector('.van-skeleton')).not.toBeNull();
  });

  // Additional: content wrapper has correct class
  it('should have content wrapper with van-skeleton__content class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { row: 1 });
        },
      }),
    );
    expect(container.querySelector('.van-skeleton__content')).not.toBeNull();
  });

  // Additional: avatar default shape is round
  it('should default avatar shape to round', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Skeleton, { avatar: true });
        },
      }),
    );
    const avatar = container.querySelector('.van-skeleton-avatar');
    expect(avatar!.getAttribute('class')).toContain(
      'van-skeleton-avatar--round',
    );
  });
});

describe('SkeletonTitle', () => {
  it('should render with correct class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonTitle);
        },
      }),
    );
    expect(container.querySelector('.van-skeleton-title')).not.toBeNull();
  });

  it('should apply titleWidth style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonTitle, { titleWidth: '80%' });
        },
      }),
    );
    const el = container.querySelector('.van-skeleton-title');
    expect(el!.getAttribute('style')).toContain('80%');
  });

  it('should add round class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonTitle, { round: true });
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-title--round'),
    ).not.toBeNull();
  });
});

describe('SkeletonAvatar', () => {
  it('should render with correct class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonAvatar);
        },
      }),
    );
    expect(container.querySelector('.van-skeleton-avatar')).not.toBeNull();
  });

  it('should default to round shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonAvatar);
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-avatar--round'),
    ).not.toBeNull();
  });

  it('should support square shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonAvatar, { avatarShape: 'square' });
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-avatar--square'),
    ).not.toBeNull();
  });

  it('should apply avatarSize style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonAvatar, { avatarSize: '60px' });
        },
      }),
    );
    const el = container.querySelector('.van-skeleton-avatar');
    expect(el!.getAttribute('style')).toContain('60px');
  });
});

describe('SkeletonParagraph', () => {
  it('should render with correct class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonParagraph);
        },
      }),
    );
    expect(container.querySelector('.van-skeleton-paragraph')).not.toBeNull();
  });

  it('should apply rowWidth style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonParagraph, { rowWidth: '60%' });
        },
      }),
    );
    const el = container.querySelector('.van-skeleton-paragraph');
    expect(el!.getAttribute('style')).toContain('60%');
  });

  it('should add round class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonParagraph, { round: true });
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-paragraph--round'),
    ).not.toBeNull();
  });
});

describe('SkeletonImage', () => {
  it('should render with correct class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonImage);
        },
      }),
    );
    expect(container.querySelector('.van-skeleton-image')).not.toBeNull();
  });

  it('should default to square shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonImage);
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-image--square'),
    ).not.toBeNull();
  });

  it('should support round shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonImage, { imageShape: 'round' });
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-image--round'),
    ).not.toBeNull();
  });

  it('should apply imageSize style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonImage, { imageSize: '120px' });
        },
      }),
    );
    const el = container.querySelector('.van-skeleton-image');
    expect(el!.getAttribute('style')).toContain('120px');
  });

  it('should render icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(SkeletonImage);
        },
      }),
    );
    expect(
      container.querySelector('.van-skeleton-image__icon'),
    ).not.toBeNull();
  });
});
