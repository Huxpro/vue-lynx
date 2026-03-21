import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Highlight from '../index.vue';

describe('Highlight', () => {
  it('should render source string', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: 'Hello world',
            keywords: 'world',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const fullText = Array.from(textEls)
      .map((t) => t.textContent)
      .join('');
    expect(fullText).toContain('Hello');
    expect(fullText).toContain('world');
  });

  it('should highlight matching keyword', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: 'Hello world',
            keywords: 'world',
            highlightColor: '#ee0a24',
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const highlighted = textEls.find((t) => t.textContent === 'world');
    expect(highlighted).toBeTruthy();
  });

  it('should render without keywords', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: 'No highlights here',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const fullText = Array.from(textEls)
      .map((t) => t.textContent)
      .join('');
    expect(fullText).toContain('No highlights here');
  });

  it('should support array of keywords', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: 'foo bar baz',
            keywords: ['foo', 'baz'],
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const texts = textEls.map((t) => t.textContent);
    expect(texts).toContain('foo');
    expect(texts).toContain('baz');
  });

  it('should be case-insensitive by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: 'Hello World',
            keywords: 'hello',
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const highlighted = textEls.find(
      (t) => t.textContent?.toLowerCase() === 'hello',
    );
    expect(highlighted).toBeTruthy();
  });

  it('should render empty string without crashing', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Highlight, {
            sourceString: '',
            keywords: 'test',
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
