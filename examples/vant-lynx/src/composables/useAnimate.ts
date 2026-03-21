import { useMainThreadRef, runOnMainThread } from 'vue-lynx';

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Composable for main-thread element.animate() transitions.
 *
 * Returns an elRef (bind via :main-thread-ref) and animation helpers
 * that can be called from the background thread.
 */
export function useAnimate() {
  const elRef = useMainThreadRef(null);

  // -- Main-thread worklet functions --

  function _fadeIn(duration: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      return (elRef as any).current.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, fill: 'forwards', easing: 'ease-out' },
      );
    }
  }

  function _fadeOut(duration: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      return (elRef as any).current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration, fill: 'forwards', easing: 'ease-in' },
      );
    }
  }

  function _slideIn(duration: number, axis: number, startPct: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY';
      return (elRef as any).current.animate(
        [
          { transform: `${prop}(${startPct}%)` },
          { transform: `${prop}(0%)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      );
    }
  }

  function _slideOut(duration: number, axis: number, endPct: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY';
      return (elRef as any).current.animate(
        [
          { transform: `${prop}(0%)` },
          { transform: `${prop}(${endPct}%)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-in' },
      );
    }
  }

  function _zoomIn(duration: number, baseTransform: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      // baseTransform: 0 = no base transform, 1 = translate(-50%, -50%) for centered elements
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : '';
      return (elRef as any).current.animate(
        [
          { opacity: 0, transform: `${prefix}scale(0.9)` },
          { opacity: 1, transform: `${prefix}scale(1)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      );
    }
  }

  function _zoomOut(duration: number, baseTransform: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : '';
      return (elRef as any).current.animate(
        [
          { opacity: 1, transform: `${prefix}scale(1)` },
          { opacity: 0, transform: `${prefix}scale(0.9)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-in' },
      );
    }
  }

  function _bounceIn(duration: number) {
    'main thread';
    if (typeof (elRef as any).current?.animate === 'function') {
      return (elRef as any).current.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.6 },
          { transform: 'scale(0.95)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      );
    }
  }

  // -- Background-thread convenience wrappers --

  function fadeIn(duration = 300) {
    runOnMainThread(_fadeIn)(duration);
  }

  function fadeOut(duration = 300) {
    runOnMainThread(_fadeOut)(duration);
  }

  function slideIn(direction: SlideDirection, duration = 300) {
    const [axis, pct] = getSlideParams(direction);
    runOnMainThread(_slideIn)(duration, axis, pct);
  }

  function slideOut(direction: SlideDirection, duration = 300) {
    const [axis, pct] = getSlideParams(direction);
    runOnMainThread(_slideOut)(duration, axis, pct);
  }

  function zoomIn(duration = 300, centered = false) {
    runOnMainThread(_zoomIn)(duration, centered ? 1 : 0);
  }

  function zoomOut(duration = 300, centered = false) {
    runOnMainThread(_zoomOut)(duration, centered ? 1 : 0);
  }

  function bounceIn(duration = 200) {
    runOnMainThread(_bounceIn)(duration);
  }

  return {
    elRef,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    zoomIn,
    zoomOut,
    bounceIn,
  };
}

function getSlideParams(direction: SlideDirection): [axis: number, pct: number] {
  switch (direction) {
    case 'up': return [1, 100];     // translateY from 100% (from below)
    case 'down': return [1, -100];  // translateY from -100% (from above)
    case 'left': return [0, -100];  // translateX from -100% (from left)
    case 'right': return [0, 100];  // translateX from 100% (from right)
  }
}
