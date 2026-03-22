import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Highlight from '../index.vue';

const sourceString =
  'Take your time and be patient. Life itself will eventually answer all those questions it once raised for you.';

describe('Highlight', () => {
  it('should render the specified text label highlighting correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: 'questions',
            sourceString,
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    expect(highlight).toBeTruthy();

    const tags = highlight!.querySelectorAll('.van-highlight__tag');
    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toBe('questions');
  });

  it('multiple keywords highlighting can be specified', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: ['time', 'life', 'questions'],
            sourceString,
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    const tags = highlight!.querySelectorAll('.van-highlight__tag');

    expect(tags.length).toBe(3);
    expect(tags[0].textContent).toBe('time');
    expect(tags[1].textContent).toBe('Life');
    expect(tags[2].textContent).toBe('questions');
  });

  it('should be correctly case sensitive', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: ['take', 'Life', 'questions'],
            sourceString,
            caseSensitive: true,
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    const tags = highlight!.querySelectorAll('.van-highlight__tag');

    expect(tags.length).toBe(2);
    expect(tags[0].textContent).toBe('Life');
    expect(tags[1].textContent).toBe('questions');
  });

  it('should set custom highlightClass prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: 'time',
            sourceString,
            highlightClass: 'my-custom-class',
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    const tag = highlight!.querySelector('.van-highlight__tag');
    expect(tag).toBeTruthy();
    expect(tag!.textContent).toBe('time');
    // highlightClass should be applied alongside van-highlight__tag
    expect(tag!.classList.contains('my-custom-class')).toBe(true);
  });

  it('should be merged when the highlighted content overlaps', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: ['ab', 'bc'],
            sourceString: 'abcd',
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    const tags = highlight!.querySelectorAll('.van-highlight__tag');

    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toBe('abc');
  });

  it('empty text should not be matched', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: ['', 'bc'],
            sourceString: 'abcd',
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    const tags = highlight!.querySelectorAll('.van-highlight__tag');

    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toBe('bc');
  });

  it('empty keywords should correctly rendered', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            keywords: '',
            sourceString: 'abcd',
          });
        },
      }),
    );

    const highlight = container.querySelector('.van-highlight');
    expect(highlight).toBeTruthy();
    expect(highlight!.textContent).toBe('abcd');

    const tags = highlight!.querySelectorAll('.van-highlight__tag');
    expect(tags.length).toBe(0);
  });
});
