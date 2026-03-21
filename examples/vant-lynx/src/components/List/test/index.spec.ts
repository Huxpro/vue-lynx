import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import List from '../index.vue';

describe('List', () => {
  it('should render list container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: false,
            finished: false,
          }, {
            default: () => h('text', null, 'List Item'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should show loading text when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            finished: false,
          }, {
            default: () => h('text', null, 'Item'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const loadingText = textEls.find((t) => t.textContent === 'Loading...');
    expect(loadingText).toBeTruthy();
  });

  it('should show finished text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: false,
            finished: true,
            finishedText: 'No more data',
          }, {
            default: () => h('text', null, 'Item'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const finishedText = textEls.find((t) => t.textContent === 'No more data');
    expect(finishedText).toBeTruthy();
  });

  it('should show error text when error', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: false,
            finished: false,
            error: true,
          }, {
            default: () => h('text', null, 'Item'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const errorText = textEls.find((t) => t.textContent?.includes('Request failed'));
    expect(errorText).toBeTruthy();
  });

  it('should render with custom loading text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            finished: false,
            loadingText: 'Please wait...',
          }, {
            default: () => h('text', null, 'Item'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const loadingText = textEls.find((t) => t.textContent === 'Please wait...');
    expect(loadingText).toBeTruthy();
  });
});
