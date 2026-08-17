import { onMounted, onUnmounted } from 'vue-lynx';

const KEYBOARD_EVENT = 'keyboardstatuschanged';
const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';

export interface KeyboardEventEmitter {
  addListener(name: string, listener: (status: unknown, height: unknown) => void): void;
  removeListener(name: string, listener: (status: unknown, height: unknown) => void): void;
}

export interface KeyboardAvoidanceTarget {
  setNativeProps(props: Record<string, unknown>): { exec(): unknown };
}

function keyboardHeight(status: unknown, height: unknown): number {
  if (status !== 'on') return 0;
  const value = typeof height === 'number' ? height : Number(height);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function bindKeyboardAvoidance(
  emitter: KeyboardEventEmitter,
  getTarget: () => KeyboardAvoidanceTarget | null,
  onHeightChange?: (height: number, previousHeight: number) => void,
): () => void {
  let previousHeight = 0;
  const listener = (status: unknown, height: unknown) => {
    const offset = keyboardHeight(status, height);
    getTarget()
      ?.setNativeProps({
        transform: `translateY(${-offset}px)`,
        transition: `transform ${offset > 0 ? '0.3s' : '0.1s'} ${EASING}`,
      })
      .exec();
    onHeightChange?.(offset, previousHeight);
    previousHeight = offset;
  };

  emitter.addListener(KEYBOARD_EVENT, listener);
  return () => emitter.removeListener(KEYBOARD_EVENT, listener);
}

export function useKeyboardAvoidance(
  target: Readonly<{ value: KeyboardAvoidanceTarget | null }>,
  onHeightChange?: (height: number, previousHeight: number) => void,
): void {
  let cleanup: (() => void) | undefined;
  const isWeb =
    (globalThis as { SystemInfo?: { platform?: string } }).SystemInfo?.platform === 'web';

  onMounted(() => {
    if (isWeb) return;
    if (typeof lynx === 'undefined') return;
    const emitter = lynx.getJSModule('GlobalEventEmitter') as KeyboardEventEmitter | undefined;
    if (!emitter) return;
    cleanup = bindKeyboardAvoidance(emitter, () => target.value, onHeightChange);
  });

  onUnmounted(() => cleanup?.());
}
