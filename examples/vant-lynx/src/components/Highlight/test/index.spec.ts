import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Highlight from '../index.vue';

const sourceString =
  'Take your time and be patient. Life itself will eventually answer all those questions it once raised for you.';

// Helper: get non-empty text elements
function getTextEls(container: Element) {
  return Array.from(container.querySelectorAll('text')).filter(
    (t) => t.textContent !== '',
  );
}

// Helper: check if a text element has the highlight color style
function isHighlighted(el: Element): boolean {
  const style = el.getAttribute('style') || '';
  // #1989fa renders as rgb(25, 137, 250) in the test env
  return style.includes('rgb(25, 137, 250)') || style.includes('#1989fa');
}

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
    const textEls = getTextEls(container);
    const highlighted = textEls.filter(isHighlighted);
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].textContent).toBe('questions');
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
    const textEls = getTextEls(container);
    const highlighted = textEls.filter(isHighlighted);

    expect(highlighted.length).toBe(3);
    expect(highlighted[0].textContent).toBe('time');
    expect(highlighted[1].textContent).toBe('Life');
    expect(highlighted[2].textContent).toBe('questions');
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
    const textEls = getTextEls(container);
    // "take" should NOT match "Take" (case-sensitive), only "Life" and "questions" match
    const highlighted = textEls.filter(isHighlighted);
    expect(highlighted.length).toBe(2);
    expect(highlighted[0].textContent).toBe('Life');
    expect(highlighted[1].textContent).toBe('questions');
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
    // highlightClass accepted for API compat; verify the highlight still renders
    const textEls = getTextEls(container);
    const highlighted = textEls.filter(isHighlighted);
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].textContent).toBe('time');
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
    const textEls = getTextEls(container);
    const highlighted = textEls.filter(isHighlighted);
    // "ab" and "bc" overlap -> merged to "abc"
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].textContent).toBe('abc');
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
    const textEls = getTextEls(container);
    const highlighted = textEls.filter(isHighlighted);
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].textContent).toBe('bc');
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
    const textEls = getTextEls(container);
    const allText = textEls.map((t) => t.textContent).join('');
    expect(allText).toBe('abcd');
    // No highlighted chunks
    const highlighted = textEls.filter(isHighlighted);
    expect(highlighted.length).toBe(0);
  });
});
