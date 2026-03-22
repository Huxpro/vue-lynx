import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Dialog from '../index.vue';
import {
  showDialog,
  showConfirmDialog,
  closeDialog,
  setDialogDefaultOptions,
  resetDialogDefaultOptions,
  dialogState,
} from '../dialog';

describe('Dialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetDialogDefaultOptions();
    dialogState.show = false;
  });

  it('should render when show is true with title and message', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            title: 'Test Title',
            message: 'Test Message',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Test Title',
    );
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Test Message',
    );
    expect(hasTitle).toBe(true);
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: false,
            title: 'Hidden Title',
            message: 'Hidden Message',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden Title',
    );
    expect(hasTitle).toBe(false);
  });

  it('should use BEM classes', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, title: 'Title', message: 'Msg' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const dialog = container.querySelector('.van-dialog');
    expect(dialog).toBeTruthy();
  });

  it('should render confirm button by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Msg' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    expect(confirm).toBeTruthy();

    const cancel = container.querySelector('.van-dialog__cancel');
    expect(cancel).toBeFalsy();
  });

  it('should render cancel button when showCancelButton is true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            showCancelButton: true,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancel = container.querySelector('.van-dialog__cancel');
    expect(cancel).toBeTruthy();
  });

  it('should emit confirm event on confirm button tap', async () => {
    const onConfirm = vi.fn();
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            onConfirm,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    expect(confirm).toBeTruthy();
    await fireEvent.tap(confirm!);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should emit cancel event on cancel button tap', async () => {
    const onCancel = vi.fn();
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            showCancelButton: true,
            onCancel,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancel = container.querySelector('.van-dialog__cancel');
    expect(cancel).toBeTruthy();
    await fireEvent.tap(cancel!);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should render custom confirm and cancel button text', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            showCancelButton: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Nope',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasOK = Array.from(textEls).some((t) => t.textContent === 'OK');
    const hasNope = Array.from(textEls).some((t) => t.textContent === 'Nope');
    expect(hasOK).toBe(true);
    expect(hasNope).toBe(true);
  });

  it('should apply confirmButtonColor', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            confirmButtonColor: '#ff0000',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    expect(confirm).toBeTruthy();
    const style = confirm!.getAttribute('style') || '';
    expect(style).toContain('color');
    // Color may be serialized as rgb(255, 0, 0) or #ff0000
    expect(style.includes('#ff0000') || style.includes('rgb(255, 0, 0)')).toBe(true);
  });

  it('should apply cancelButtonColor', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            showCancelButton: true,
            cancelButtonColor: '#00ff00',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const cancel = container.querySelector('.van-dialog__cancel');
    expect(cancel).toBeTruthy();
    const style = cancel!.getAttribute('style') || '';
    expect(style).toContain('color');
    expect(style.includes('#00ff00') || style.includes('rgb(0, 255, 0)')).toBe(true);
  });

  it('should render title slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Dialog,
            { show: true, message: 'Msg' },
            { title: () => h('text', {}, 'Custom Title') },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Title',
    );
    expect(hasTitle).toBe(true);
  });

  it('should render default slot as content', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Dialog,
            { show: true, title: 'Title' },
            { default: () => h('text', {}, 'Custom Content') },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Content',
    );
    expect(hasContent).toBe(true);
  });

  it('should render footer slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Dialog,
            { show: true, message: 'Msg' },
            { footer: () => h('text', {}, 'Custom Footer') },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasFooter = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Footer',
    );
    expect(hasFooter).toBe(true);
  });

  it('should apply custom width', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Msg', width: 400 });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const dialog = container.querySelector('.van-dialog');
    expect(dialog).toBeTruthy();
    const style = dialog!.getAttribute('style') || '';
    expect(style).toContain('400px');
  });

  it('should render header--isolated class when no message', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, title: 'Only Title' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const header = container.querySelector('.van-dialog__header--isolated');
    expect(header).toBeTruthy();
  });

  it('should render content--isolated class when no title', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Only Message' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const content = container.querySelector('.van-dialog__content--isolated');
    expect(content).toBeTruthy();
  });

  it('should render message--has-title class when title exists', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            title: 'Title',
            message: 'Message',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const msg = container.querySelector('.van-dialog__message--has-title');
    expect(msg).toBeTruthy();
  });

  it('should support messageAlign prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            messageAlign: 'left',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const msg = container.querySelector('.van-dialog__message--left');
    expect(msg).toBeTruthy();
  });

  it('should apply round-button theme class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            theme: 'round-button',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const dialog = container.querySelector('.van-dialog--round-button');
    expect(dialog).toBeTruthy();
  });

  it('should support beforeClose with loading state', async () => {
    const beforeClose = vi.fn(
      () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 500)),
    );
    const onUpdateShow = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            beforeClose,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    await fireEvent.tap(confirm!);

    expect(beforeClose).toHaveBeenCalledWith('confirm');
    // Should show loading
    await nextTick();
    const loadingEl = container.querySelector('.van-loading');
    expect(loadingEl).toBeTruthy();

    // Not closed yet
    expect(onUpdateShow).not.toHaveBeenCalled();

    // Resolve the promise
    vi.advanceTimersByTime(500);
    await nextTick();
    await nextTick();

    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should not close when beforeClose returns false', async () => {
    const beforeClose = vi.fn(() => Promise.resolve(false));
    const onUpdateShow = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            beforeClose,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    await fireEvent.tap(confirm!);
    await nextTick();
    await nextTick();

    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should support function message prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: () => 'Dynamic Message',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasMsg = Array.from(textEls).some(
      (t) => t.textContent === 'Dynamic Message',
    );
    expect(hasMsg).toBe(true);
  });

  it('should render overlay by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Msg' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should not render overlay when overlay is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Msg', overlay: false });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should render footer with BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, { show: true, message: 'Msg' });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const footer = container.querySelector('.van-dialog__footer');
    expect(footer).toBeTruthy();
  });

  it('should call callback on close', async () => {
    const callback = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            callback,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const confirm = container.querySelector('.van-dialog__confirm');
    await fireEvent.tap(confirm!);

    expect(callback).toHaveBeenCalledWith('confirm');
  });

  it('should render default button text in Chinese', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            message: 'Msg',
            showCancelButton: true,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some(
      (t) => t.textContent === '确认',
    );
    const hasCancel = Array.from(textEls).some(
      (t) => t.textContent === '取消',
    );
    expect(hasConfirm).toBe(true);
    expect(hasCancel).toBe(true);
  });

  // --- Imperative API tests ---

  it('showDialog should update dialogState', () => {
    showDialog({ title: 'Imperative', message: 'Hello' });
    expect(dialogState.show).toBe(true);
    expect(dialogState.title).toBe('Imperative');
    expect(dialogState.message).toBe('Hello');
  });

  it('showConfirmDialog should show cancel button', () => {
    showConfirmDialog({ title: 'Confirm', message: 'Sure?' });
    expect(dialogState.show).toBe(true);
    expect(dialogState.showCancelButton).toBe(true);
  });

  it('closeDialog should hide dialog', () => {
    showDialog({ message: 'Open' });
    expect(dialogState.show).toBe(true);
    closeDialog();
    expect(dialogState.show).toBe(false);
  });

  it('setDialogDefaultOptions should merge defaults', () => {
    setDialogDefaultOptions({ confirmButtonColor: '#ff0000' });
    showDialog({ message: 'Test' });
    expect(dialogState.confirmButtonColor).toBe('#ff0000');
  });

  it('resetDialogDefaultOptions should restore defaults', () => {
    setDialogDefaultOptions({ confirmButtonColor: '#ff0000' });
    resetDialogDefaultOptions();
    showDialog({ message: 'Test' });
    expect(dialogState.confirmButtonColor).toBeUndefined();
  });

  it('showDialog should return a promise', () => {
    const result = showDialog({ message: 'Promise' });
    expect(result).toBeInstanceOf(Promise);
    closeDialog();
  });

  it('should not emit confirm when show is false', async () => {
    const onConfirm = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: false,
            message: 'Msg',
            onConfirm,
          });
        },
      }),
    );
    // Dialog not rendered, so no confirm button to tap
    const confirm = container.querySelector('.van-dialog__confirm');
    expect(confirm).toBeFalsy();
  });
});
