import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import IndexBar from '../../IndexBar/index.vue';
import IndexAnchor from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
}

describe('IndexAnchor', () => {
  it('should render anchor with van-index-anchor class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    expect(anchor).toBeTruthy();
  });

  it('should render index text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    expect(anchor).toBeTruthy();
    const textEls = anchor!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('A');
  });

  it('should render numeric index', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: [1] }, {
            default: () => h(IndexAnchor, { index: 1 }),
          });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    const textEls = anchor!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('1');
  });

  it('should render custom content via default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }, {
              default: () => h('text', {}, 'Custom Title A'),
            }),
          });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    const textEls = anchor!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el: any) => el.textContent);
    expect(texts).toContain('Custom Title A');
  });

  it('should render multiple anchors', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B', 'C'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
              h(IndexAnchor, { index: 'C' }),
            ],
          });
        },
      }),
    );
    const anchors = container.querySelectorAll('.van-index-anchor');
    expect(anchors.length).toBe(3);
  });

  it('should render anchor with correct base styling from CSS', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A'] }, {
            default: () => h(IndexAnchor, { index: 'A' }),
          });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    expect(anchor).toBeTruthy();
    // Verify it has the BEM class (styles come from CSS)
    expect(anchor!.classList.contains('van-index-anchor')).toBe(true);
  });

  it('should render anchors inside IndexBar wrapper', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexBar, { indexList: ['A', 'B'] }, {
            default: () => [
              h(IndexAnchor, { index: 'A' }),
              h(IndexAnchor, { index: 'B' }),
            ],
          });
        },
      }),
    );
    const wrapper = container.querySelector('.van-index-bar__wrapper');
    expect(wrapper).toBeTruthy();
    const anchors = wrapper!.querySelectorAll('.van-index-anchor');
    expect(anchors.length).toBe(2);
  });

  it('should work without IndexBar parent', () => {
    // IndexAnchor can render standalone (no parent injection)
    const { container } = render(
      defineComponent({
        render() {
          return h(IndexAnchor, { index: 'A' });
        },
      }),
    );
    const anchor = container.querySelector('.van-index-anchor');
    expect(anchor).toBeTruthy();
  });
});
