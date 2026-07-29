<script setup lang="ts">
import { useMainThreadRef } from 'vue-lynx';

declare const SystemInfo: { pixelWidth: number; pixelHeight: number; pixelRatio: number };

// Logical screen size (captured into the worklets as plain numbers).
const W = SystemInfo.pixelWidth / SystemInfo.pixelRatio;
const H = SystemInfo.pixelHeight / SystemInfo.pixelRatio;

const RIPPLE_POOL = 10;
const SPARK_POOL = 64;
const RIPPLE_SIZE = 120; // px, matches .ripple in CSS
const ORB_SIZE = 200; // px, matches .orb in CSS

// One MainThreadRef per animated element — hydrated to PAPI element handles
// inside the worklets. Plus one ref holding the whole engine state on MT.
const orbRef = useMainThreadRef<unknown>(null);
const flareRef = useMainThreadRef<unknown>(null);
const engRef = useMainThreadRef<Record<string, unknown> | null>(null);
const rippleRefs = Array.from({ length: RIPPLE_POOL }, () => useMainThreadRef<unknown>(null));
const sparkRefs = Array.from({ length: SPARK_POOL }, () => useMainThreadRef<unknown>(null));

// Spark hues: four green shades assigned round-robin via CSS classes.
const sparkClass = (i: number) => `spark spark-${i % 4}`;

type MTElement = {
  setStyleProperty(k: string, v: string): void;
  setStyleProperties(styles: Record<string, string>): void;
};
type MTRef<T> = { current: T };
type LynxTouch = { clientX?: number; clientY?: number; x?: number; y?: number };
type LynxTouchEvent = { touches?: LynxTouch[]; changedTouches?: LynxTouch[] };

// ---------------------------------------------------------------------------
// Main Thread engine
//
// Everything below the `'main thread'` directives runs on the Main Thread —
// zero cross-thread round-trips between your finger and the pixels. State
// lives in `engRef.current` (persisted by the worklet-runtime's ref map), and
// per-frame updates run on `requestAnimationFrame` on the Main Thread.
// ---------------------------------------------------------------------------

const touchX = (t: LynxTouch): number => {
  'main thread';
  return (t.clientX ?? t.x ?? 0) as number;
};

const touchY = (t: LynxTouch): number => {
  'main thread';
  return (t.clientY ?? t.y ?? 0) as number;
};

const getEngine = () => {
  'main thread';
  const eng = engRef as unknown as MTRef<Record<string, any> | null>;
  if (eng.current) return eng.current;

  const homeX = W / 2;
  const homeY = H * 0.42;
  const el = (r: unknown) => (r as MTRef<MTElement | null>).current;
  // NOTE: captured arrays may arrive on the Main Thread as objects with
  // numeric keys (the web platform's event path does not preserve
  // Array prototypes), so pools are built by index, never by Array methods.
  const refAt = (refs: unknown, i: number) => (refs as Record<number, unknown>)[i];

  const st: Record<string, any> = {
    // Orb spring state: position, velocity, target, grab flag.
    ox: homeX,
    oy: homeY,
    vx: 0,
    vy: 0,
    tx: homeX,
    ty: homeY,
    homeX,
    homeY,
    grabbed: false,
    // Finger tracking (for velocity-biased spark trails).
    fx: 0,
    fy: 0,
    pfx: 0,
    pfy: 0,
    // Pools. `t` counts frames since spawn; a huge value means inactive.
    ripples: [] as Record<string, any>[],
    sparks: [] as Record<string, any>[],
    ri: 0, // ripple pool cursor
    si: 0, // spark pool cursor
    frame: 0,
    sinceRipple: 1e9,
    running: false,
  };

  for (let i = 0; i < RIPPLE_POOL; i++) {
    st.ripples.push({ el: el(refAt(rippleRefs, i)), t: 1e9, x: 0, y: 0, big: false });
  }
  for (let i = 0; i < SPARK_POOL; i++) {
    st.sparks.push({ el: el(refAt(sparkRefs, i)), t: 1e9, life: 1, x: 0, y: 0, vx: 0, vy: 0, size: 1 });
  }

  st.spawnRipple = (x: number, y: number, big: boolean) => {
    const rp = st.ripples[st.ri % st.ripples.length];
    st.ri++;
    rp.t = 0;
    rp.x = x;
    rp.y = y;
    rp.big = big;
    st.sinceRipple = 0;
  };

  st.spawnSpark = (x: number, y: number, vx: number, vy: number, life: number, size: number) => {
    const sp = st.sparks[st.si % st.sparks.length];
    st.si++;
    sp.t = 0;
    sp.life = life;
    sp.x = x;
    sp.y = y;
    sp.vx = vx;
    sp.vy = vy;
    sp.size = size;
  };

  // Firework: radial burst of sparks. Pseudo-random angles derived from the
  // pool cursor (Math.random is unavailable in worklets — and determinism is
  // a feature here anyway).
  st.burst = (x: number, y: number, n: number, speed: number) => {
    for (let i = 0; i < n; i++) {
      const a = ((st.si * 37 + i * 137 + st.frame * 7) % 360) * (Math.PI / 180);
      const v = speed * (0.45 + ((st.si * 13 + i * 29) % 100) / 100 * 0.85);
      st.spawnSpark(
        x,
        y,
        Math.cos(a) * v,
        Math.sin(a) * v,
        34 + ((st.si * 11 + i * 17) % 26),
        0.7 + ((st.si * 7 + i * 23) % 100) / 100 * 0.9,
      );
    }
  };

  const orbEl = () => el(orbRef);
  const flareEl = () => el(flareRef);
  const halfOrb = ORB_SIZE / 2;
  const halfRipple = RIPPLE_SIZE / 2;

  const step = () => {
    st.frame++;
    st.sinceRipple++;

    // --- Orb: critically-ish damped spring chasing its target -------------
    const k = st.grabbed ? 0.085 : 0.055;
    const damp = st.grabbed ? 0.82 : 0.88;
    st.vx = (st.vx + (st.tx - st.ox) * k) * damp;
    st.vy = (st.vy + (st.ty - st.oy) * k) * damp;
    st.ox += st.vx;
    st.oy += st.vy;

    const speed = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
    // Squash & stretch along the velocity vector — the "alive blob" feel.
    const s = Math.min(speed * 0.012, 0.42);
    const ang = Math.atan2(st.vy, st.vx) * (180 / Math.PI);
    const orb = orbEl();
    if (orb) {
      orb.setStyleProperty(
        'transform',
        `translate(${st.ox - halfOrb}px, ${st.oy - halfOrb}px) `
          + `rotate(${ang}deg) scaleX(${1 + s}) scaleY(${1 - s * 0.6}) rotate(${-ang}deg)`,
      );
    }
    const flare = flareEl();
    if (flare) {
      // Glow flares up with movement, breathes back down at rest.
      flare.setStyleProperty('opacity', String(Math.min(0.25 + speed * 0.05, 1)));
    }

    // --- Ripples: expanding, fading rings ----------------------------------
    let alive = 0;
    for (const rp of st.ripples) {
      const dur = rp.big ? 62 : 46;
      if (rp.t > dur) continue;
      const p = rp.t / dur;
      const eased = 1 - (1 - p) * (1 - p) * (1 - p); // easeOutCubic
      const scale = 0.18 + eased * (rp.big ? 4.4 : 2.9);
      const op = (1 - p) * (1 - p) * 0.9;
      if (rp.el) {
        rp.el.setStyleProperties({
          transform: `translate(${rp.x - halfRipple}px, ${rp.y - halfRipple}px) scale(${scale})`,
          opacity: String(op),
        });
      }
      rp.t++;
      alive++;
    }

    // --- Sparks: tiny glowing embers with drag + a whiff of gravity --------
    for (const sp of st.sparks) {
      if (sp.t > sp.life) continue;
      const p = sp.t / sp.life;
      sp.vx *= 0.962;
      sp.vy = sp.vy * 0.962 + 0.055;
      sp.x += sp.vx;
      sp.y += sp.vy;
      if (sp.el) {
        sp.el.setStyleProperties({
          transform: `translate(${sp.x - 5}px, ${sp.y - 5}px) scale(${sp.size * (1 - p * 0.72)})`,
          opacity: String((1 - p) * (1 - p * 0.35)),
        });
      }
      sp.t++;
      alive++;
    }

    // --- Continuous feed while the finger is down ---------------------------
    if (st.grabbed) {
      // Water rings keep pulsing under the finger for the entire drag.
      if (st.sinceRipple >= 9) st.spawnRipple(st.fx, st.fy, false);
      // Ember trail biased along finger velocity.
      const fvx = st.fx - st.pfx;
      const fvy = st.fy - st.pfy;
      const j = st.frame;
      st.spawnSpark(
        st.fx,
        st.fy,
        fvx * 0.18 + Math.cos(j * 2.4) * 1.6,
        fvy * 0.18 + Math.sin(j * 1.7) * 1.6,
        26 + (j * 13) % 18,
        0.5 + ((j * 29) % 100) / 100 * 0.7,
      );
      st.pfx = st.fx;
      st.pfy = st.fy;
    }

    // Keep looping while touching, while particles live, or while the orb
    // still has meaningful momentum; park the loop when everything settles.
    if (st.grabbed || alive > 0 || speed > 0.05) {
      requestAnimationFrame(step);
    } else {
      st.running = false;
      st.ox = st.homeX;
      st.oy = st.homeY;
      st.vx = 0;
      st.vy = 0;
      if (orb) {
        orb.setStyleProperty(
          'transform',
          `translate(${st.homeX - halfOrb}px, ${st.homeY - halfOrb}px)`,
        );
      }
      if (flare) flare.setStyleProperty('opacity', '0.25');
    }
  };

  st.wake = () => {
    if (st.running) return;
    st.running = true;
    requestAnimationFrame(step);
  };

  eng.current = st;
  return st;
};

const onTouchStart = (e: LynxTouchEvent) => {
  'main thread';
  const st = getEngine() as Record<string, any>;
  const touches = e.touches ?? [];
  if (touches.length === 0) return;
  const x = touchX(touches[0]);
  const y = touchY(touches[0]);
  st.grabbed = true;
  st.tx = x;
  st.ty = y;
  st.fx = x;
  st.fy = y;
  st.pfx = x;
  st.pfy = y;
  st.spawnRipple(x, y, true);
  st.burst(x, y, 12, 5.5);
  // Extra fingers each get their own splash.
  for (let i = 1; i < touches.length; i++) {
    st.spawnRipple(touchX(touches[i]), touchY(touches[i]), false);
    st.burst(touchX(touches[i]), touchY(touches[i]), 8, 4.5);
  }
  st.wake();
};

const onTouchMove = (e: LynxTouchEvent) => {
  'main thread';
  const st = getEngine() as Record<string, any>;
  const touches = e.touches ?? [];
  if (touches.length === 0) return;
  st.fx = touchX(touches[0]);
  st.fy = touchY(touches[0]);
  st.tx = st.fx;
  st.ty = st.fy;
  // Secondary fingers sprinkle sparks too.
  for (let i = 1; i < touches.length; i++) {
    st.spawnSpark(
      touchX(touches[i]),
      touchY(touches[i]),
      Math.cos(st.frame * 1.3) * 2,
      Math.sin(st.frame * 2.1) * 2,
      24,
      0.8,
    );
  }
  st.wake();
};

const onTouchEnd = (e: LynxTouchEvent) => {
  'main thread';
  const st = getEngine() as Record<string, any>;
  const remaining = e.touches ?? [];
  if (remaining.length > 0) {
    // Another finger is still down — hand the orb over to it.
    st.fx = touchX(remaining[0]);
    st.fy = touchY(remaining[0]);
    st.tx = st.fx;
    st.ty = st.fy;
    return;
  }
  st.grabbed = false;
  st.tx = st.homeX;
  st.ty = st.homeY;
  // Goodbye firework at the release point.
  const last = (e.changedTouches ?? [])[0];
  const x = last ? touchX(last) : st.fx;
  const y = last ? touchY(last) : st.fy;
  st.spawnRipple(x, y, true);
  st.burst(x, y, 20, 7.5);
  st.wake();
};
</script>

<template>
  <view
    class="stage"
    :main-thread-bindtouchstart="onTouchStart"
    :main-thread-bindtouchmove="onTouchMove"
    :main-thread-bindtouchend="onTouchEnd"
    :main-thread-bindtouchcancel="onTouchEnd"
  >
    <!-- Water ripples -->
    <view
      v-for="(r, i) in rippleRefs"
      :key="`r${i}`"
      class="ripple"
      :main-thread-ref="r"
    />

    <!-- Firework sparks -->
    <view
      v-for="(s, i) in sparkRefs"
      :key="`s${i}`"
      :class="sparkClass(i)"
      :main-thread-ref="s"
    />

    <!-- The orb — chases your finger with a springy squash & stretch -->
    <view
      class="orb"
      :main-thread-ref="orbRef"
      :style="{ transform: `translate(${W / 2 - 100}px, ${H * 0.42 - 100}px)` }"
    >
      <view class="orb-glow" />
      <view class="orb-flare" :main-thread-ref="flareRef" />
      <view class="orb-ring" />
      <view class="orb-core" />
    </view>

    <text class="hint">touch · drag · flick</text>
  </view>
</template>
