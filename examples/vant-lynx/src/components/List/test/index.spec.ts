import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import List from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
}

describe('List', () => {
  it('should render root with van-list class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, { immediateCheck: false });
        },
      }),
    );

    const root = container.querySelector('.van-list');
    expect(root).toBeTruthy();
  });

  it('should emit load event when immediateCheck is true (default)', async () => {
    const onLoad = vi.fn();
    const onUpdateLoading = vi.fn();

    render(
      defineComponent({
        render() {
          return h(List, {
            onLoad,
            'onUpdate:loading': onUpdateLoading,
          });
        },
      }),
    );

    await later();
    expect(onLoad).toHaveBeenCalled();
    expect(onUpdateLoading).toHaveBeenCalledWith(true);
  });

  it('should not emit load event when disabled', async () => {
    const onLoad = vi.fn();
    const onUpdateLoading = vi.fn();

    render(
      defineComponent({
        render() {
          return h(List, {
            disabled: true,
            onLoad,
            'onUpdate:loading': onUpdateLoading,
          });
        },
      }),
    );

    await later();
    expect(onLoad).not.toHaveBeenCalled();
    expect(onUpdateLoading).not.toHaveBeenCalled();
  });

  it('should reload after clicking the error text', async () => {
    const onLoad = vi.fn();
    const onUpdateError = vi.fn();
    const onUpdateLoading = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            error: true,
            errorText: 'Request failed. Click to reload...',
            onLoad,
            'onUpdate:error': onUpdateError,
            'onUpdate:loading': onUpdateLoading,
          });
        },
      }),
    );

    await later();

    // Should not load when error is true
    expect(onLoad).not.toHaveBeenCalled();
    expect(onUpdateLoading).not.toHaveBeenCalled();

    // Find error text element and click it
    const errorView = container.querySelector('.van-list__error-text');
    expect(errorView).toBeTruthy();

    if (errorView) {
      await fireEvent.tap(errorView);
      expect(onUpdateError).toHaveBeenCalledWith(false);
    }
  });

  it('should render finished text when finished prop is true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            finished: true,
            finishedText: 'Finished',
          });
        },
      }),
    );

    await later();

    const finishedView = container.querySelector('.van-list__finished-text');
    expect(finishedView).toBeTruthy();

    const textEls = Array.from(container.querySelectorAll('text'));
    const finishedText = textEls.find((t: any) => t.textContent === 'Finished');
    expect(finishedText).toBeTruthy();
  });

  it('should not render finished text when finishedText is empty', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            finished: true,
          });
        },
      }),
    );

    await later();

    const finishedView = container.querySelector('.van-list__finished-text');
    expect(finishedView).toBeFalsy();
  });

  it('should render finished slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            List,
            { finished: true },
            { finished: () => h('text', null, 'Custom Finished') },
          );
        },
      }),
    );

    await later();

    const finishedView = container.querySelector('.van-list__finished-text');
    expect(finishedView).toBeTruthy();

    const textEls = Array.from(container.querySelectorAll('text'));
    const customText = textEls.find((t: any) => t.textContent === 'Custom Finished');
    expect(customText).toBeTruthy();
  });

  it('should render error slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            List,
            { error: true },
            { error: () => h('text', null, 'Custom Error') },
          );
        },
      }),
    );

    await later();

    const errorView = container.querySelector('.van-list__error-text');
    expect(errorView).toBeTruthy();

    const textEls = Array.from(container.querySelectorAll('text'));
    const customText = textEls.find((t: any) => t.textContent === 'Custom Error');
    expect(customText).toBeTruthy();
  });

  it('should not emit load event after mounted when immediate-check is false', async () => {
    const onLoad = vi.fn();
    const onUpdateLoading = vi.fn();

    render(
      defineComponent({
        render() {
          return h(List, {
            immediateCheck: false,
            onLoad,
            'onUpdate:loading': onUpdateLoading,
          });
        },
      }),
    );

    await later();
    expect(onLoad).not.toHaveBeenCalled();
    expect(onUpdateLoading).not.toHaveBeenCalled();
  });

  it('should render loading state with van-list__loading class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            List,
            {
              loading: true,
              finished: false,
              immediateCheck: false,
            },
            { default: () => h('text', null, 'Item') },
          );
        },
      }),
    );

    const loadingView = container.querySelector('.van-list__loading');
    expect(loadingView).toBeTruthy();
  });

  it('should render loading-icon with van-list__loading-icon class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            finished: false,
            immediateCheck: false,
          });
        },
      }),
    );

    const loadingIcon = container.querySelector('.van-list__loading-icon');
    expect(loadingIcon).toBeTruthy();
  });

  it('should not show loading when finished', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            finished: true,
            immediateCheck: false,
          });
        },
      }),
    );

    const loadingView = container.querySelector('.van-list__loading');
    expect(loadingView).toBeFalsy();
  });

  it('should render placeholder with van-list__placeholder class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            immediateCheck: false,
          });
        },
      }),
    );

    const placeholder = container.querySelector('.van-list__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should render placeholder before content when direction is up', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            List,
            {
              direction: 'up',
              immediateCheck: false,
            },
            { default: () => h('view', { class: 'list-item' }, [h('text', null, 'list item')]) },
          );
        },
      }),
    );

    const rootView = container.querySelector('.van-list');
    expect(rootView).toBeTruthy();

    if (rootView) {
      const children = Array.from(rootView.children) as any[];
      // First child should be placeholder
      const firstCls = children[0]?.getAttribute('class') || '';
      expect(firstCls).toContain('van-list__placeholder');
    }
  });

  it('should expose check method', async () => {
    const listRef = ref<any>(null);
    const onLoad = vi.fn();

    render(
      defineComponent({
        render() {
          return h(List, {
            ref: (el: any) => { listRef.value = el; },
            immediateCheck: false,
            onLoad,
          });
        },
      }),
    );

    await later();
    expect(onLoad).not.toHaveBeenCalled();

    // Call exposed check method
    listRef.value?.check();
    await later();
    expect(onLoad).toHaveBeenCalled();
  });

  it('should render with custom loading text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            finished: false,
            loadingText: 'Please wait...',
            immediateCheck: false,
          });
        },
      }),
    );

    const textEls = Array.from(container.querySelectorAll('text'));
    const loadingText = textEls.find((t: any) => t.textContent === 'Please wait...');
    expect(loadingText).toBeTruthy();
  });

  it('should not show loading when disabled', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(List, {
            loading: true,
            disabled: true,
            immediateCheck: false,
          });
        },
      }),
    );

    const loadingView = container.querySelector('.van-list__loading');
    expect(loadingView).toBeFalsy();
  });
});
