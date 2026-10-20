/**
 * vue-lynx/motion — the style helpers drive a main thread element's
 * setStyleProperty frame by frame and settle on the target.
 */

import { describe, it, expect } from 'vitest';
import {
  animateStyle,
  animateTranslate,
  animateValue,
  cubicBezier,
  springStyle,
} from '../../../vue-lynx/runtime/src/motion.js';

function target() {
  const writes: [string, string][] = [];
  return {
    writes,
    setStyleProperty(name: string, value: string) {
      writes.push([name, value]);
    },
  };
}

describe('vue-lynx/motion', () => {
  it('animateStyle writes the property every frame and ends on the target', async () => {
    const el = target();
    await animateStyle(el, 'opacity', 1, { from: 0, duration: 0.05 });
    expect(el.writes.length).toBeGreaterThan(1);
    expect(el.writes.at(-1)).toEqual(['opacity', '1']);
    expect(el.writes.every(([name]) => name === 'opacity')).toBe(true);
  });

  it('appends the unit to every value', async () => {
    const el = target();
    await animateStyle(el, 'width', 40, { from: 0, duration: 0.05, unit: 'px' });
    expect(el.writes.at(-1)).toEqual(['width', '40px']);
    expect(el.writes.every(([, value]) => value.endsWith('px'))).toBe(true);
  });

  it('springStyle settles on the target', async () => {
    const el = target();
    await springStyle(el, 'opacity', 1, { from: 0, stiffness: 400, damping: 40 });
    expect(Number(el.writes.at(-1)![1])).toBeCloseTo(1, 2);
  });

  it('animateTranslate writes one transform per frame from start to end', async () => {
    const el = target();
    await animateTranslate(el, { x: 0, y: 10 }, { x: 100 }, { duration: 0.05 });
    expect(el.writes[0]).toEqual(['transform', 'translate(0px, 10px)']);
    expect(el.writes.at(-1)).toEqual(['transform', 'translate(100px, 10px)']);
  });

  it('writes the start value synchronously', () => {
    const el = target();
    animateStyle(el, 'opacity', 1, { from: 0.25, duration: 1 });
    expect(el.writes).toEqual([['opacity', '0.25']]);
  });

  it('a spring overshoots with low damping and never with high damping', async () => {
    const loose: number[] = [];
    await animateValue((v) => loose.push(v), 1, {
      type: 'spring',
      from: 0,
      stiffness: 400,
      damping: 8,
    });
    expect(Math.max(...loose)).toBeGreaterThan(1);
    expect(loose.at(-1)).toBe(1);

    const tight: number[] = [];
    await animateValue((v) => tight.push(v), 1, {
      type: 'spring',
      from: 0,
      stiffness: 400,
      damping: 60,
    });
    expect(Math.max(...tight)).toBeLessThanOrEqual(1);
    expect(tight.at(-1)).toBe(1);
  });

  it('cubicBezier hits the end points and the midpoint of ease-in-out', () => {
    const ease = cubicBezier(0.42, 0, 0.58, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5, 3);
    expect(ease(0.25)).toBeLessThan(0.25);
  });

  it('stop() ends an animation early', async () => {
    const el = target();
    const anim = animateStyle(el, 'opacity', 1, { from: 0, duration: 10 });
    anim.stop();
    const count = el.writes.length;
    await new Promise((r) => setTimeout(r, 60));
    expect(el.writes.length).toBe(count);
  });
});
