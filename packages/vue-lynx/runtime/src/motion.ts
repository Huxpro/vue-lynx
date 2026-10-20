// Copyright 2026 The Vue Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `vue-lynx/motion` — numeric animation helpers for main thread functions.
 *
 * A self-contained spring and tween that write to a main thread element's
 * `setStyleProperty` once per frame. It carries no dependency on purpose:
 * `@lynx-js/motion` is written for ReactLynx and its entries import the
 * React runtime at module load, which a Vue Lynx bundle must not carry.
 * The options vocabulary (`type: 'spring'`, `stiffness`, `damping`, `mass`,
 * `duration`, `ease`, `from`, `velocity`) matches it, so a later swap is a
 * one-line change.
 *
 * This is a shared module: import it with `with { runtime: 'shared' }` and
 * call it inside a `'main thread'` function.
 *
 * @example
 * ```ts
 * import { springStyle } from 'vue-lynx/motion' with { runtime: 'shared' }
 *
 * const boxRef = useMainThreadRef<MainThread.Element>(null)
 * const onTap = () => {
 *   'main thread'
 *   const el = boxRef.current
 *   if (el) springStyle(el, 'opacity', 1, { from: 0 })
 * }
 * ```
 */

export type Easing = (progress: number) => number;

export interface AnimationOptions {
  /** `'spring'` runs a damped spring; `'tween'` (the default) eases over `duration`. */
  type?: 'spring' | 'tween';
  /** Seconds, tween only. @defaultValue 0.3 */
  duration?: number;
  /** Tween only. @defaultValue easeOut */
  ease?: Easing;
  /** Spring only. @defaultValue 100 */
  stiffness?: number;
  /** Spring only. @defaultValue 10 */
  damping?: number;
  /** Spring only. @defaultValue 1 */
  mass?: number;
  /** Start value. @defaultValue 0 */
  from?: number;
  /** Start velocity in units per second, spring only. @defaultValue 0 */
  velocity?: number;
  /** Spring rest thresholds. @defaultValue 0.01 */
  restDelta?: number;
  restSpeed?: number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

export interface AnimationHandle {
  /** Stop where it is; `finished` resolves. */
  stop(): void;
  /** Resolves when the animation settles or is stopped. */
  readonly finished: Promise<void>;
  then(onFulfilled?: () => void): Promise<void>;
}

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

export const linear: Easing = (p) => p;

/** A cubic bezier easing, the CSS `cubic-bezier(x1, y1, x2, y2)`. */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Easing {
  const sampleX = (t: number): number =>
    ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
  const sampleY = (t: number): number =>
    ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
  const slopeX = (t: number): number =>
    3 * (1 - 3 * x2 + 3 * x1) * t * t + 2 * (3 * x2 - 6 * x1) * t + 3 * x1;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const slope = slopeX(t);
      if (slope === 0) break;
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) break;
      t -= err / slope;
    }
    return sampleY(Math.min(1, Math.max(0, t)));
  };
}

export const easeIn: Easing = cubicBezier(0.42, 0, 1, 1);
export const easeOut: Easing = cubicBezier(0, 0, 0.58, 1);
export const easeInOut: Easing = cubicBezier(0.42, 0, 0.58, 1);

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

type FrameCallback = (now: number) => void;

const nextFrame: (cb: FrameCallback) => void =
  typeof requestAnimationFrame === 'function'
    ? (cb) => {
        requestAnimationFrame(() => cb(Date.now()));
      }
    : (cb) => {
        setTimeout(() => cb(Date.now()), 16);
      };

/** Longest step the spring integrates in one go; a stalled frame never explodes. */
const MAX_STEP_MS = 64;
/** Spring substep, in seconds. */
const SUBSTEP = 1 / 240;

/**
 * Animate a number from `options.from` to `to`, handing every frame to
 * `write`. The first frame is written synchronously so the target starts
 * exactly at `from`.
 */
export function animateValue(
  write: (value: number) => void,
  to: number,
  options: AnimationOptions = {},
): AnimationHandle {
  const from = options.from ?? 0;
  const isSpring = options.type === 'spring';
  const duration = Math.max(0, options.duration ?? 0.3);
  const ease = options.ease ?? easeOut;
  const stiffness = options.stiffness ?? 100;
  const damping = options.damping ?? 10;
  const mass = options.mass ?? 1;
  const restDelta = options.restDelta ?? 0.01;
  const restSpeed = options.restSpeed ?? 0.01;

  let value = from;
  let velocity = options.velocity ?? 0;
  let stopped = false;
  let settled = false;
  let last = Date.now();
  const start = last;

  let resolve: () => void = () => undefined;
  const finished = new Promise<void>((r) => {
    resolve = r;
  });

  const emit = (v: number): void => {
    value = v;
    write(v);
    options.onUpdate?.(v);
  };

  const settle = (): void => {
    if (settled) return;
    settled = true;
    options.onComplete?.();
    resolve();
  };

  const stepSpring = (now: number): boolean => {
    let dt = Math.min(now - last, MAX_STEP_MS) / 1000;
    last = now;
    while (dt > 0) {
      const h = Math.min(SUBSTEP, dt);
      const accel = (-stiffness * (value - to) - damping * velocity) / mass;
      velocity += accel * h;
      value += velocity * h;
      dt -= h;
    }
    const atRest =
      Math.abs(velocity) < restSpeed && Math.abs(value - to) < restDelta;
    emit(atRest ? to : value);
    return atRest;
  };

  const stepTween = (now: number): boolean => {
    const elapsed = (now - start) / 1000;
    if (duration === 0 || elapsed >= duration) {
      emit(to);
      return true;
    }
    emit(from + (to - from) * ease(elapsed / duration));
    return false;
  };

  const tick: FrameCallback = (now) => {
    if (stopped) return;
    const done = isSpring ? stepSpring(now) : stepTween(now);
    if (done) settle();
    else nextFrame(tick);
  };

  emit(from);
  if (from === to && !isSpring) settle();
  else nextFrame(tick);

  return {
    stop() {
      stopped = true;
      settle();
    },
    finished,
    then(onFulfilled) {
      return finished.then(onFulfilled);
    },
  };
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

/** The slice of a main thread Element the helpers need. */
export interface StyleTarget {
  setStyleProperty(name: string, value: string): void;
}

export interface StyleAnimationOptions extends AnimationOptions {
  /** Appended to every value written, for example `'px'` or `'deg'`. */
  unit?: string;
}

/** Animate one numeric style property on a main thread element. */
export function animateStyle(
  el: StyleTarget,
  property: string,
  to: number,
  options: StyleAnimationOptions = {},
): AnimationHandle {
  const { unit = '', ...rest } = options;
  return animateValue(
    (v) => el.setStyleProperty(property, `${v}${unit}`),
    to,
    rest,
  );
}

/** `animateStyle` with a spring, the default feel for chrome that moves. */
export function springStyle(
  el: StyleTarget,
  property: string,
  to: number,
  options: StyleAnimationOptions = {},
): AnimationHandle {
  return animateStyle(el, property, to, { ...options, type: 'spring' });
}

export interface TranslateTarget {
  x?: number;
  y?: number;
}

/**
 * Animate a 2D translate on a main thread element. Both axes ride one
 * animation so the element writes one `transform` per frame.
 */
export function animateTranslate(
  el: StyleTarget,
  from: TranslateTarget,
  to: TranslateTarget,
  options: AnimationOptions = {},
): AnimationHandle {
  const x0 = from.x ?? 0;
  const y0 = from.y ?? 0;
  const x1 = to.x ?? x0;
  const y1 = to.y ?? y0;
  return animateValue(
    (t) => {
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      el.setStyleProperty('transform', `translate(${x}px, ${y}px)`);
    },
    1,
    { ...options, from: 0 },
  );
}
