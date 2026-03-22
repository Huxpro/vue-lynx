import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Toast from '../index.vue';
import {
  showToast,
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  closeToast,
  allowMultipleToast,
  setToastDefaultOptions,
  resetToastDefaultOptions,
  toastState,
} from '../toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    closeToast();
    resetToastDefaultOptions();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // === Component Tests (matching Vant's test/index.spec.ts) ===

  it('should render with BEM class when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Hello' });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hello',
    );
    expect(hasMessage).toBe(true);
  });

  it('should not render toast when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: false, message: 'Hidden' });
        },
      }),
    );
    // Toast is lazy-rendered; never shown, so no .van-toast element
    const toast = container.querySelector('.van-toast');
    // Either no element or opacity 0
    if (toast) {
      const style = toast.getAttribute('style') || '';
      expect(style).toContain('opacity: 0');
    }
  });

  it('should apply position BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Top', position: 'top' });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast).toBeTruthy();
    expect(toast!.className).toContain('van-toast--top');
  });

  it('should apply bottom position BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Bottom', position: 'bottom' });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast!.className).toContain('van-toast--bottom');
  });

  it('should apply text type BEM class for text type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'text', message: 'Text Toast' });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast!.className).toContain('van-toast--text');
  });

  it('should close Toast when using closeOnClick prop and clicked', async () => {
    const onUpdate = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            message: 'Click me',
            closeOnClick: true,
            'onUpdate:show': onUpdate,
          });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast).toBeTruthy();
    fireEvent.tap(toast!);
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('should close Toast when using closeOnClickOverlay prop', async () => {
    const onUpdate = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            message: 'Overlay',
            overlay: true,
            closeOnClickOverlay: true,
            'onUpdate:show': onUpdate,
          });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.tap(overlay!);
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('should render overlay when overlay prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Overlay', overlay: true });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should render transparent overlay when forbidClick is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            message: 'Forbid',
            forbidClick: true,
          });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('transparent');
  });

  it('should not render overlay by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'No overlay' });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should render success icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'success', message: 'Done' });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast).toBeTruthy();
    // Should have icon element and message text
    const iconEl = container.querySelector('.van-toast__icon');
    expect(iconEl).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some((t) => t.textContent === 'Done');
    expect(hasMessage).toBe(true);
  });

  it('should render fail icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'fail', message: 'Error' });
        },
      }),
    );
    const iconEl = container.querySelector('.van-toast__icon');
    expect(iconEl).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some((t) => t.textContent === 'Error');
    expect(hasMessage).toBe(true);
  });

  it('should render loading type with loading class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            type: 'loading',
            message: 'Loading...',
          });
        },
      }),
    );
    const loadingEl = container.querySelector('.van-toast__loading');
    expect(loadingEl).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Loading...',
    );
    expect(hasMessage).toBe(true);
  });

  it('should render custom icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            icon: 'star',
            message: 'Custom',
          });
        },
      }),
    );
    const iconEl = container.querySelector('.van-toast__icon');
    expect(iconEl).toBeTruthy();
  });

  it('should render message slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true }, {
            message: () => h('text', {}, 'Custom Slot Message'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSlotMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Slot Message',
    );
    expect(hasSlotMessage).toBe(true);
  });

  it('should apply className prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            message: 'Custom class',
            className: 'my-toast',
          });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast!.className).toContain('my-toast');
  });

  it('should apply word break modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            message: 'Word break',
            wordBreak: 'break-word',
          });
        },
      }),
    );
    const toast = container.querySelector('.van-toast');
    expect(toast!.className).toContain('van-toast--break-word');
  });

  it('should have text--only class when no icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'text', message: 'Text' });
        },
      }),
    );
    const textEl = container.querySelector('.van-toast__text--only');
    expect(textEl).toBeTruthy();
  });

  it('should have text class without --only when icon present', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'success', message: 'Success' });
        },
      }),
    );
    const textEl = container.querySelector('.van-toast__text');
    expect(textEl).toBeTruthy();
    // Should not have --only modifier since icon is shown
    expect(textEl!.className).not.toContain('van-toast__text--only');
  });

  // === Imperative API Tests ===

  it('toast disappeared after duration', () => {
    showToast({ message: 'test', duration: 1000 });
    expect(toastState.value.show).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(toastState.value.show).toBe(false);
  });

  it('show loading toast', () => {
    showLoadingToast('Loading...');
    expect(toastState.value.show).toBe(true);
    expect(toastState.value.type).toBe('loading');
    expect(toastState.value.message).toBe('Loading...');
    // Loading toast default duration is 0 (persistent)
    expect(toastState.value.duration).toBe(0);
  });

  it('show success toast', () => {
    showSuccessToast('Success');
    expect(toastState.value.show).toBe(true);
    expect(toastState.value.type).toBe('success');
    expect(toastState.value.message).toBe('Success');
  });

  it('show fail toast', () => {
    showFailToast('Failed');
    expect(toastState.value.show).toBe(true);
    expect(toastState.value.type).toBe('fail');
    expect(toastState.value.message).toBe('Failed');
  });

  it('icon prop', () => {
    showToast({ message: 'test', icon: 'star' });
    expect(toastState.value.icon).toBe('star');
  });

  it('clear toast', () => {
    showToast({ message: 'test', duration: 0 });
    expect(toastState.value.show).toBe(true);

    closeToast();
    expect(toastState.value.show).toBe(false);
  });

  it('set default options', () => {
    setToastDefaultOptions({ duration: 1000 });
    showToast('test');
    expect(toastState.value.duration).toBe(1000);

    resetToastDefaultOptions();
    showToast('test2');
    expect(toastState.value.duration).toBe(2000);
  });

  it('set default options by type', () => {
    setToastDefaultOptions('loading', { forbidClick: true });
    showLoadingToast('Loading');
    expect(toastState.value.forbidClick).toBe(true);

    resetToastDefaultOptions('loading');
    showLoadingToast('Loading again');
    expect(toastState.value.forbidClick).toBe(false);
  });

  it('toast duration 0', () => {
    showToast({ message: 'test', duration: 0 });
    expect(toastState.value.show).toBe(true);

    vi.advanceTimersByTime(10000);
    // Should still be showing since duration is 0
    expect(toastState.value.show).toBe(true);
  });

  it('should trigger onClose callback after closed', () => {
    const onClose = vi.fn();
    showToast({ message: 'test', duration: 1000, onClose });

    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should trigger onOpened callback', () => {
    const onOpened = vi.fn();
    showToast({ message: 'test', onOpened });
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it('should update message on returned instance', () => {
    const toast = showToast({ message: 'initial', duration: 0 });
    expect(toastState.value.message).toBe('initial');

    toast.message = 'updated';
    expect(toastState.value.message).toBe('updated');
  });

  it('should close via returned instance', () => {
    const toast = showToast({ message: 'test', duration: 0 });
    expect(toastState.value.show).toBe(true);

    toast.close();
    expect(toastState.value.show).toBe(false);
  });

  it('should support position prop', () => {
    showToast({ message: 'top', position: 'top' });
    expect(toastState.value.position).toBe('top');

    showToast({ message: 'bottom', position: 'bottom' });
    expect(toastState.value.position).toBe('bottom');
  });

  it('should support wordBreak prop', () => {
    showToast({ message: 'test', wordBreak: 'break-word' });
    expect(toastState.value.wordBreak).toBe('break-word');
  });
});
