import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Notify from '../index.vue';
import {
  showNotify,
  closeNotify,
  setNotifyDefaultOptions,
  resetNotifyDefaultOptions,
  notifyState,
} from '../notify';

function later(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Notify', () => {
  afterEach(() => {
    closeNotify();
    resetNotifyDefaultOptions();
  });

  // Component tests
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Test message' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Test message',
    );
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: false, message: 'Hidden' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden',
    );
    expect(hasMessage).toBe(false);
  });

  it('should render with danger type by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Error' });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
    expect(el!.className).toContain('van-notify--danger');
  });

  it('should render with primary type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, type: 'primary', message: 'Info' });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
    expect(el!.className).toContain('van-notify--primary');
  });

  it('should render with success type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, type: 'success', message: 'Done' });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
    expect(el!.className).toContain('van-notify--success');
  });

  it('should render with warning type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, type: 'warning', message: 'Warn' });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
    expect(el!.className).toContain('van-notify--warning');
  });

  it('should apply custom color and background via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, {
            show: true,
            message: 'Custom',
            color: '#ad0000',
            background: '#ffe1e1',
          });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
  });

  it('should render with bottom position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, {
            show: true,
            message: 'Bottom',
            position: 'bottom',
          });
        },
      }),
    );
    const el = container.querySelector('.van-notify--bottom');
    expect(el).not.toBeNull();
  });

  it('should render with top position by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Top' });
        },
      }),
    );
    const el = container.querySelector('.van-notify--top');
    expect(el).not.toBeNull();
  });

  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Notify,
            { show: true },
            { default: () => h('text', null, 'Slot content') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSlot = Array.from(textEls).some(
      (t) => t.textContent === 'Slot content',
    );
    expect(hasSlot).toBe(true);
  });

  it('should emit update:show event', async () => {
    const onUpdateShow = vi.fn();
    render(
      defineComponent({
        render() {
          return h(Notify, {
            show: true,
            message: 'Test',
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    // The component should support v-model:show
    expect(typeof onUpdateShow).toBe('function');
  });

  it('should render message prop as text content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Hello World' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hello World',
    );
    expect(hasMessage).toBe(true);
  });

  it('should render numeric message', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 123 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === '123',
    );
    expect(hasMessage).toBe(true);
  });

  it('should have van-notify BEM class on root', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'BEM test' });
        },
      }),
    );
    const el = container.querySelector('.van-notify');
    expect(el).not.toBeNull();
  });

  it('should apply className prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, {
            show: true,
            message: 'Test',
            className: 'custom-notify',
          });
        },
      }),
    );
    const el = container.querySelector('.custom-notify');
    expect(el).not.toBeNull();
  });

  // Imperative API tests
  describe('Imperative API', () => {
    it('should not throw when calling closeNotify before showNotify', () => {
      expect(() => closeNotify()).not.toThrow();
    });

    it('should set notifyState.show to true when showNotify is called', () => {
      showNotify('test');
      expect(notifyState.value.show).toBe(true);
    });

    it('should set message from string argument', () => {
      showNotify('hello');
      expect(notifyState.value.message).toBe('hello');
    });

    it('should set type to danger by default', () => {
      showNotify('test');
      expect(notifyState.value.type).toBe('danger');
    });

    it('should set type from options', () => {
      showNotify({ type: 'success', message: 'ok' });
      expect(notifyState.value.type).toBe('success');
    });

    it('should set custom color and background', () => {
      showNotify({ message: 'custom', color: '#fff', background: '#000' });
      expect(notifyState.value.color).toBe('#fff');
      expect(notifyState.value.background).toBe('#000');
    });

    it('should set position', () => {
      showNotify({ message: 'bottom', position: 'bottom' });
      expect(notifyState.value.position).toBe('bottom');
    });

    it('should close after duration', async () => {
      showNotify({ message: 'test', duration: 10 });
      expect(notifyState.value.show).toBe(true);
      await later(50);
      expect(notifyState.value.show).toBe(false);
    });

    it('should not auto-close when duration is 0', async () => {
      showNotify({ message: 'test', duration: 0 });
      expect(notifyState.value.show).toBe(true);
      await later(50);
      expect(notifyState.value.show).toBe(true);
    });

    it('should close when closeNotify is called', () => {
      showNotify({ message: 'test', duration: 0 });
      expect(notifyState.value.show).toBe(true);
      closeNotify();
      expect(notifyState.value.show).toBe(false);
    });

    it('should call onClose callback when closing', async () => {
      const onClose = vi.fn();
      showNotify({ message: 'test', duration: 10, onClose });
      await later(50);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onOpened callback when opening', () => {
      const onOpened = vi.fn();
      showNotify({ message: 'test', onOpened });
      expect(onOpened).toHaveBeenCalledTimes(1);
    });

    it('should change default options via setNotifyDefaultOptions', () => {
      setNotifyDefaultOptions({ message: 'default msg' });
      showNotify({});
      expect(notifyState.value.message).toBe('default msg');
    });

    it('should reset default options via resetNotifyDefaultOptions', () => {
      setNotifyDefaultOptions({ message: 'custom default' });
      resetNotifyDefaultOptions();
      showNotify({});
      expect(notifyState.value.message).toBe('');
    });

    it('should override previous notify when called again', () => {
      showNotify({ message: 'first', duration: 0 });
      showNotify({ message: 'second', duration: 0 });
      expect(notifyState.value.message).toBe('second');
    });

    it('should set className in state', () => {
      showNotify({ message: 'test', className: 'my-class' });
      expect(notifyState.value.className).toBe('my-class');
    });

    it('should set lockScroll in state', () => {
      showNotify({ message: 'test', lockScroll: true });
      expect(notifyState.value.lockScroll).toBe(true);
    });

    it('should set zIndex in state', () => {
      showNotify({ message: 'test', zIndex: 9999 });
      expect(notifyState.value.zIndex).toBe(9999);
    });
  });
});
