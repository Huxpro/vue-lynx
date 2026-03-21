import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import TextEllipsis from '../index.vue';

describe('TextEllipsis', () => {
  it('should render text content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content: 'This is a short text.',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render with expand text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content: 'This is a very long text that should be truncated because it exceeds the maximum number of characters allowed per row in the component rendering.',
            rows: 1,
            expandText: 'Expand',
            collapseText: 'Collapse',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render with custom rows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content: 'Short',
            rows: 3,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom dots', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TextEllipsis, {
            content: 'A very long text that needs to be truncated at some point because it goes beyond the available display area for this component.',
            rows: 1,
            dots: '***',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });
});
