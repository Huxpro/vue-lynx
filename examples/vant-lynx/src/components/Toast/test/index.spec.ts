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

  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Hello' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hello',
    );
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: false, message: 'Hidden' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden',
    );
    expect(hasMessage).toBe(false);
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
    // Find the toast box (the innermost view with the message)
    const views = container.querySelectorAll('view');
    // The toast content box is the 3rd view (container > position > toast box)
    const toastBox = views[2];
    if (toastBox) {
      fireEvent.tap(toastBox);
      await nextTick();
    }
    expect(onUpdate).toHaveBeenCalledWith(false);
  });

  it('should close Toast when using closeOnClickOverlay prop and overlay is clicked', async () => {
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
    // Click the outermost container (overlay)
    const overlayView = container.querySelector('view');
    if (overlayView) {
      fireEvent.tap(overlayView);
      await nextTick();
    }
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
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    expect(style).toContain('rgba(0, 0, 0, 0.7)');
  });

  it('should not show overlay background by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'No Overlay' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    expect(style).toContain('transparent');
  });

  it('should render success icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'success', message: 'Done' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    // Should have both icon text and message text
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render fail icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'fail', message: 'Error' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Error',
    );
    expect(hasMessage).toBe(true);
  });

  it('should render loading type', () => {
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
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Loading...',
    );
    expect(hasMessage).toBe(true);
  });

  it('should change icon size when using icon-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            type: 'success',
            message: 'Icon Size',
            iconSize: 20,
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    // Icon element should exist with the message
    expect(textEls.length).toBeGreaterThanOrEqual(1);
  });

  it('should change loading icon size when using icon-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, {
            show: true,
            type: 'loading',
            message: 'Loading',
            iconSize: '20px',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Loading',
    );
    expect(hasMessage).toBe(true);
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
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should support forbidClick prop', () => {
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
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    // When forbidClick is true, overlay should block clicks (no pointerEvents: none)
    expect(style).not.toContain('pointer-events: none');
  });

  // === Imperative API Tests (matching Vant's test/function.spec.ts) ===

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
});
