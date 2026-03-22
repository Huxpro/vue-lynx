import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Signature from '../index.vue';

describe('Signature', () => {
  it('should render with BEM base class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const root = container.querySelector('.van-signature');
    expect(root).toBeTruthy();
  });

  it('should render content area', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const content = container.querySelector('.van-signature__content');
    expect(content).toBeTruthy();
  });

  it('should render footer with buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const footer = container.querySelector('.van-signature__footer');
    expect(footer).toBeTruthy();
    const buttons = footer!.querySelectorAll('.van-button');
    expect(buttons.length).toBe(2);
  });

  it('should render default button texts', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('清空');
    expect(texts).toContain('确认');
  });

  it('should allow custom button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, {
            clearButtonText: 'Reset',
            confirmButtonText: 'Done',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('Reset');
    expect(texts).toContain('Done');
  });

  it('should render tips text when provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { tips: 'Please sign here' });
        },
      }),
    );
    const tipsEl = container.querySelector('.van-signature__tips');
    expect(tipsEl).toBeTruthy();
    expect(tipsEl!.textContent).toBe('Please sign here');
  });

  it('should emit start event on touchstart', async () => {
    const onStart = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onStart });
        },
      }),
    );
    const canvasArea = container.querySelector('.van-signature__canvas-area');
    fireEvent.touchstart(canvasArea!, { touches: [{ clientX: 10, clientY: 20 }] });
    expect(onStart).toHaveBeenCalled();
  });

  it('should emit end event on touchend', async () => {
    const onEnd = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onEnd });
        },
      }),
    );
    const canvasArea = container.querySelector('.van-signature__canvas-area');
    // Must start drawing first
    fireEvent.touchstart(canvasArea!, { touches: [{ clientX: 10, clientY: 20 }] });
    fireEvent.touchend(canvasArea!);
    expect(onEnd).toHaveBeenCalled();
  });

  it('should emit signing event on touchmove', async () => {
    const onSigning = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onSigning });
        },
      }),
    );
    const canvasArea = container.querySelector('.van-signature__canvas-area');
    fireEvent.touchstart(canvasArea!, { touches: [{ clientX: 10, clientY: 20 }] });
    fireEvent.touchmove(canvasArea!, { touches: [{ clientX: 30, clientY: 40 }] });
    expect(onSigning).toHaveBeenCalled();
  });

  it('should emit clear event when clear button is tapped', async () => {
    const onClear = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onClear });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    // First button is clear
    fireEvent.tap(buttons[0]);
    expect(onClear).toHaveBeenCalled();
  });

  it('should emit submit event when confirm button is tapped', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onSubmit });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    // Second button is confirm
    fireEvent.tap(buttons[1]);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should submit empty image when nothing is drawn', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { onSubmit });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-button');
    fireEvent.tap(buttons[1]);
    expect(onSubmit).toHaveBeenCalledWith({ image: '', canvas: null });
  });

  it('should apply backgroundColor style when prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { backgroundColor: '#eee' });
        },
      }),
    );
    const content = container.querySelector('.van-signature__content');
    expect(content).toBeTruthy();
    const style = content!.getAttribute('style') || '';
    expect(style).toContain('background-color');
  });

  it('should expose resize, clear, and submit methods', () => {
    let instance: any;
    render(
      defineComponent({
        setup() {
          const sigRef = ref(null);
          instance = sigRef;
          return () => h(Signature, { ref: sigRef });
        },
      }),
    );
    expect(typeof instance.value?.resize).toBe('function');
    expect(typeof instance.value?.clear).toBe('function');
    expect(typeof instance.value?.submit).toBe('function');
  });

  it('should render canvas area for drawing', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const canvasArea = container.querySelector('.van-signature__canvas-area');
    expect(canvasArea).toBeTruthy();
  });
});
