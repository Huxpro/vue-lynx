<script setup vapor lang="ts">
// All gesture sampling and visual mutations stay on Lynx's main thread.
import { useMainThreadRef } from 'vue-lynx/vapor'

declare const SystemInfo: {
  pixelWidth: number
  pixelHeight: number
  pixelRatio: number
  platform: string
}

interface MainThreadNode {
  setStyleProperty?(name: string, value: string): void
}

interface TouchPoint {
  pageX?: number
  pageY?: number
  clientX: number
  clientY: number
}

interface MainThreadTouchEvent {
  touches?: TouchPoint[]
  changedTouches?: TouchPoint[]
  detail?: {
    x?: number
    y?: number
    touches?: TouchPoint[]
    changedTouches?: TouchPoint[]
  }
}

const screenWidth = SystemInfo.pixelWidth / SystemInfo.pixelRatio
const screenHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio
const originX = screenWidth / 2
const originY = screenHeight * 0.43
const usePageCoordinates = SystemInfo.platform !== 'web'

const orbAnchorRef = useMainThreadRef<MainThreadNode | null>(null)
const orbBodyRef = useMainThreadRef<MainThreadNode | null>(null)
const auraRef = useMainThreadRef<MainThreadNode | null>(null)

const trail1Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail2Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail3Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail4Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail5Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail6Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail7Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail8Ref = useMainThreadRef<MainThreadNode | null>(null)
const trail9Ref = useMainThreadRef<MainThreadNode | null>(null)

const ripple1Ref = useMainThreadRef<MainThreadNode | null>(null)
const ripple2Ref = useMainThreadRef<MainThreadNode | null>(null)
const ripple3Ref = useMainThreadRef<MainThreadNode | null>(null)
const ripple4Ref = useMainThreadRef<MainThreadNode | null>(null)

const burst1Ref = useMainThreadRef<MainThreadNode | null>(null)
const burst2Ref = useMainThreadRef<MainThreadNode | null>(null)
const burst3Ref = useMainThreadRef<MainThreadNode | null>(null)

const lastXRef = useMainThreadRef(originX)
const lastYRef = useMainThreadRef(originY)
const trailIndexRef = useMainThreadRef(0)
const rippleIndexRef = useMainThreadRef(0)
const burstIndexRef = useMainThreadRef(0)
const sampleIndexRef = useMainThreadRef(0)

function styleNode(
  nodeRef: { current: MainThreadNode | null },
  name: string,
  value: string,
) {
  'main thread'
  nodeRef.current?.setStyleProperty?.(name, value)
}

function pointFromEvent(event: MainThreadTouchEvent): TouchPoint | null {
  'main thread'
  const point = event.touches?.[0]
    ?? event.detail?.touches?.[0]
    ?? event.changedTouches?.[0]
    ?? event.detail?.changedTouches?.[0]
    ?? null
  if (!point) return null

  // Native client coordinates are relative to the window; page coordinates
  // are relative to the LynxView that contains this full-screen experience.
  // Lynx-for-Web normalizes client coordinates for embedded views.
  if (usePageCoordinates && point.pageX != null) point.clientX = point.pageX
  if (usePageCoordinates && point.pageY != null) point.clientY = point.pageY
  return point
}

function moveNode(
  nodeRef: { current: MainThreadNode | null },
  x: number,
  y: number,
) {
  'main thread'
  styleNode(
    nodeRef,
    'transform',
    `translate(${x - originX}px, ${y - originY}px)`,
  )
}

function placeTrail(x: number, y: number) {
  'main thread'
  const slot = trailIndexRef.current % 9
  if (slot === 0) moveNode(trail1Ref, x, y)
  else if (slot === 1) moveNode(trail2Ref, x, y)
  else if (slot === 2) moveNode(trail3Ref, x, y)
  else if (slot === 3) moveNode(trail4Ref, x, y)
  else if (slot === 4) moveNode(trail5Ref, x, y)
  else if (slot === 5) moveNode(trail6Ref, x, y)
  else if (slot === 6) moveNode(trail7Ref, x, y)
  else if (slot === 7) moveNode(trail8Ref, x, y)
  else moveNode(trail9Ref, x, y)
  trailIndexRef.current += 1
}

function placeRipple(x: number, y: number) {
  'main thread'
  const slot = rippleIndexRef.current % 4
  if (slot === 0) moveNode(ripple1Ref, x, y)
  else if (slot === 1) moveNode(ripple2Ref, x, y)
  else if (slot === 2) moveNode(ripple3Ref, x, y)
  else moveNode(ripple4Ref, x, y)
  rippleIndexRef.current += 1
}

function placeBurst(x: number, y: number) {
  'main thread'
  const slot = burstIndexRef.current % 3
  if (slot === 0) {
    moveNode(burst1Ref, x, y)
    styleNode(burst1Ref, 'opacity', '1')
  } else if (slot === 1) {
    moveNode(burst2Ref, x, y)
    styleNode(burst2Ref, 'opacity', '1')
  } else {
    moveNode(burst3Ref, x, y)
    styleNode(burst3Ref, 'opacity', '1')
  }
  burstIndexRef.current += 1
}

function updateOrb(x: number, y: number) {
  'main thread'
  const dx = x - lastXRef.current
  const dy = y - lastYRef.current
  const speed = Math.min(Math.sqrt(dx * dx + dy * dy), 28)
  const stretch = 1 + speed * 0.012
  const squeeze = 1 - Math.min(speed * 0.006, 0.18)
  const angle = Math.atan2(dy, dx) * 57.2958

  moveNode(orbAnchorRef, x, y)
  moveNode(auraRef, x, y)
  styleNode(orbBodyRef, 'transition', 'none')
  styleNode(
    orbBodyRef,
    'transform',
    `rotate(${angle}deg) scale(${stretch}, ${squeeze})`,
  )

  lastXRef.current = x
  lastYRef.current = y
}

function reactAt(x: number, y: number, forceBurst: boolean) {
  'main thread'
  updateOrb(x, y)
  placeTrail(x, y)

  const sample = sampleIndexRef.current + 1
  sampleIndexRef.current = sample
  if (sample % 4 === 0 || forceBurst) placeRipple(x, y)
  if (sample % 11 === 0 || forceBurst) placeBurst(x, y)
}

const handleTouchStart = (event: MainThreadTouchEvent) => {
  'main thread'
  const point = pointFromEvent(event)
  if (!point) return
  lastXRef.current = point.clientX
  lastYRef.current = point.clientY
  sampleIndexRef.current = 0
  styleNode(auraRef, 'opacity', '0.92')
  reactAt(point.clientX, point.clientY, true)
}

const handleTouchMove = (event: MainThreadTouchEvent) => {
  'main thread'
  const point = pointFromEvent(event)
  if (!point) return
  reactAt(point.clientX, point.clientY, false)
}

const handleTouchEnd = (event: MainThreadTouchEvent) => {
  'main thread'
  const point = pointFromEvent(event)
  if (point) reactAt(point.clientX, point.clientY, true)
  styleNode(
    orbBodyRef,
    'transition',
    'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
  )
  styleNode(orbBodyRef, 'transform', 'rotate(0deg) scale(1, 1)')
  styleNode(auraRef, 'opacity', '0.46')
}
</script>

<template>
  <view
    class="page"
    :main-thread-bindtouchstart="handleTouchStart"
    :main-thread-bindtouchmove="handleTouchMove"
    :main-thread-bindtouchend="handleTouchEnd"
    :main-thread-bindtouchcancel="handleTouchEnd"
  >
    <view class="ambient ambient-left" />
    <view class="ambient ambient-right" />

    <view class="heading">
      <text class="eyebrow">VAPOR CREATURE · 01</text>
      <text class="title">CHASE THE LIGHT</text>
      <text class="hint">PRESS · DRAG · SURPRISE</text>
    </view>

    <view class="stage" accessibility-element="true" accessibility-label="Interactive neon creature. Touch and drag anywhere.">
      <view class="ripple-anchor ripple-one" :main-thread-ref="ripple1Ref">
        <view class="ripple ripple-a" />
        <view class="ripple ripple-b" />
      </view>
      <view class="ripple-anchor ripple-two" :main-thread-ref="ripple2Ref">
        <view class="ripple ripple-a" />
        <view class="ripple ripple-b" />
      </view>
      <view class="ripple-anchor ripple-three" :main-thread-ref="ripple3Ref">
        <view class="ripple ripple-a" />
        <view class="ripple ripple-b" />
      </view>
      <view class="ripple-anchor ripple-four" :main-thread-ref="ripple4Ref">
        <view class="ripple ripple-a" />
        <view class="ripple ripple-b" />
      </view>

      <view class="burst-anchor burst-one" :main-thread-ref="burst1Ref">
        <view v-for="index in 10" :key="index" class="spoke" :style="{ transform: `rotate(${index * 36}deg)` }">
          <view class="spark" />
        </view>
      </view>
      <view class="burst-anchor burst-two" :main-thread-ref="burst2Ref">
        <view v-for="index in 10" :key="index" class="spoke" :style="{ transform: `rotate(${index * 36 + 18}deg)` }">
          <view class="spark spark-small" />
        </view>
      </view>
      <view class="burst-anchor burst-three" :main-thread-ref="burst3Ref">
        <view v-for="index in 10" :key="index" class="spoke" :style="{ transform: `rotate(${index * 36}deg)` }">
          <view class="spark" />
        </view>
      </view>

      <view class="trail-anchor trail-delay-1" :main-thread-ref="trail1Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-2" :main-thread-ref="trail2Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-3" :main-thread-ref="trail3Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-4" :main-thread-ref="trail4Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-5" :main-thread-ref="trail5Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-6" :main-thread-ref="trail6Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-7" :main-thread-ref="trail7Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-8" :main-thread-ref="trail8Ref"><view class="trail-dot" /></view>
      <view class="trail-anchor trail-delay-9" :main-thread-ref="trail9Ref"><view class="trail-dot" /></view>

      <view class="aura-anchor" :main-thread-ref="auraRef">
        <view class="aura" />
      </view>

      <view class="orb-anchor" :main-thread-ref="orbAnchorRef">
        <view class="orb-body" :main-thread-ref="orbBodyRef">
          <view class="orb-shell">
            <view class="orb-depth" />
            <view class="orb-eye orb-eye-left" />
            <view class="orb-eye orb-eye-right" />
            <view class="orb-glint" />
            <view class="orb-rim" />
          </view>
        </view>
      </view>
    </view>

    <view class="footer">
      <view class="live-dot" />
      <text class="footer-text">MOVE TO PLAY</text>
      <view class="footer-line" />
      <text class="footer-count">∞</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  background-color: #020403;
  color: #efffd2;
  touch-action: none;
}

.ambient {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 110px;
  opacity: 0.13;
  background: radial-gradient(circle, #75db17 0%, #163c0d 36%, transparent 72%);
}

.ambient-left {
  left: -130px;
  top: 42%;
}

.ambient-right {
  right: -160px;
  top: 12%;
}

.heading {
  position: absolute;
  top: 8.4%;
  left: 24px;
  right: 24px;
  z-index: 20;
}

.eyebrow {
  color: #9dff38;
  font-family: "Avenir Next", "Helvetica Neue", sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.6px;
}

.title {
  margin-top: 8px;
  color: #efffd2;
  font-family: "Avenir Next Condensed", "Helvetica Neue", sans-serif;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.6px;
}

.hint {
  margin-top: 5px;
  color: #547049;
  font-family: "Avenir Next", "Helvetica Neue", sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.9px;
}

.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.aura-anchor,
.orb-anchor,
.trail-anchor,
.ripple-anchor,
.burst-anchor {
  position: absolute;
  left: 50%;
  top: 43%;
}

.aura-anchor {
  width: 230px;
  height: 230px;
  margin-left: -115px;
  margin-top: -115px;
  opacity: 0.46;
  transition: opacity 300ms linear;
}

.aura {
  width: 230px;
  height: 230px;
  border-radius: 115px;
  background: radial-gradient(circle, rgba(169, 255, 28, 0.26) 0%, rgba(100, 255, 24, 0.08) 42%, transparent 70%);
  animation: aura-breathe 2.8s cubic-bezier(0.65, 0, 0.35, 1) infinite alternate;
}

.orb-anchor {
  width: 158px;
  height: 158px;
  margin-left: -79px;
  margin-top: -79px;
  z-index: 12;
}

.orb-body {
  width: 158px;
  height: 158px;
  transform-origin: center;
}

.orb-shell {
  position: relative;
  width: 158px;
  height: 158px;
  overflow: hidden;
  border-radius: 79px;
  background: radial-gradient(circle at 47% 42%, #477600 0%, #244b00 46%, #88e600 72%, #baff15 88%, #487b00 100%);
  box-shadow: 0 0 28px rgba(154, 255, 19, 0.34), inset 0 0 18px rgba(211, 255, 95, 0.72);
  animation: creature-breathe 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite alternate;
}

.orb-depth {
  position: absolute;
  left: 28px;
  right: 28px;
  top: 32px;
  bottom: 25px;
  border-radius: 50px;
  opacity: 0.9;
  background: radial-gradient(circle, rgba(2, 10, 0, 0.9) 0%, rgba(12, 40, 0, 0.58) 47%, transparent 74%);
}

.orb-eye {
  position: absolute;
  top: 54px;
  width: 43px;
  height: 62px;
  border-radius: 50%;
  opacity: 0.64;
  background: radial-gradient(circle at 80% 50%, rgba(204, 255, 91, 0.95) 0%, rgba(118, 207, 13, 0.72) 8%, rgba(22, 55, 0, 0.1) 38%, transparent 72%);
}

.orb-eye-left {
  left: 18px;
  transform: scaleX(-1);
}

.orb-eye-right {
  right: 18px;
}

.orb-glint {
  position: absolute;
  left: 35px;
  top: 23px;
  width: 72px;
  height: 23px;
  border-radius: 50%;
  opacity: 0.25;
  transform: rotate(-15deg);
  background: linear-gradient(180deg, rgba(238, 255, 196, 0.86), transparent);
}

.orb-rim {
  position: absolute;
  inset: 8px;
  border-width: 2px;
  border-style: solid;
  border-color: rgba(202, 255, 74, 0.45);
  border-radius: 72px;
}

.trail-anchor {
  width: 30px;
  height: 30px;
  margin-left: -15px;
  margin-top: -15px;
  z-index: 7;
}

.trail-dot {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  opacity: 0.54;
  background: radial-gradient(circle, #e3ff9a 0%, #99ff21 22%, rgba(99, 255, 18, 0.16) 58%, transparent 72%);
  animation: trail-pulse 900ms cubic-bezier(0.65, 0, 0.35, 1) infinite alternate;
}

.trail-delay-2 .trail-dot { animation-delay: -100ms; transform: scale(0.9); }
.trail-delay-3 .trail-dot { animation-delay: -200ms; transform: scale(0.78); }
.trail-delay-4 .trail-dot { animation-delay: -300ms; transform: scale(0.68); }
.trail-delay-5 .trail-dot { animation-delay: -400ms; transform: scale(0.58); }
.trail-delay-6 .trail-dot { animation-delay: -500ms; transform: scale(0.5); }
.trail-delay-7 .trail-dot { animation-delay: -600ms; transform: scale(0.43); }
.trail-delay-8 .trail-dot { animation-delay: -700ms; transform: scale(0.36); }
.trail-delay-9 .trail-dot { animation-delay: -800ms; transform: scale(0.3); }

.ripple-anchor {
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  z-index: 5;
}

.ripple {
  position: absolute;
  left: -54px;
  top: -54px;
  width: 120px;
  height: 120px;
  border-width: 1px;
  border-style: solid;
  border-color: rgba(151, 255, 45, 0.62);
  border-radius: 60px;
  opacity: 0;
  animation: ripple-flow 1.7s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.ripple-b {
  animation-delay: -850ms;
}

.ripple-two .ripple { animation-delay: -400ms; }
.ripple-two .ripple-b { animation-delay: -1250ms; }
.ripple-three .ripple { animation-delay: -800ms; }
.ripple-three .ripple-b { animation-delay: -1650ms; }
.ripple-four .ripple { animation-delay: -1200ms; }
.ripple-four .ripple-b { animation-delay: -2050ms; }

.burst-anchor {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-top: -5px;
  z-index: 8;
  opacity: 0;
  transition: opacity 120ms linear;
}

.spoke {
  position: absolute;
  left: 4px;
  top: -40px;
  width: 2px;
  height: 90px;
  transform-origin: 1px 45px;
}

.spark {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  opacity: 0;
  background-color: #d7ff75;
  box-shadow: 0 0 8px rgba(169, 255, 35, 0.9);
  animation: spark-flight 1.35s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.spark-small {
  height: 11px;
  background-color: #7cff2d;
  animation-delay: -675ms;
}

.burst-two .spark { animation-delay: -450ms; }
.burst-three .spark { animation-delay: -900ms; }

.footer {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 5.8%;
  z-index: 20;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 4px;
  background-color: #a9ff27;
  box-shadow: 0 0 10px rgba(169, 255, 39, 0.8);
  animation: live-pulse 1.2s linear infinite alternate;
}

.footer-text,
.footer-count {
  color: #789466;
  font-family: "Avenir Next", "Helvetica Neue", sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.9px;
}

.footer-text {
  margin-left: 9px;
}

.footer-line {
  flex: 1;
  height: 1px;
  margin-left: 14px;
  margin-right: 12px;
  background-color: #1a2b16;
}

.footer-count {
  color: #a9ff27;
  font-size: 16px;
}

@keyframes creature-breathe {
  from { transform: scale(0.97); }
  to { transform: scale(1.03); }
}

@keyframes aura-breathe {
  from { transform: scale(0.88); opacity: 0.35; }
  to { transform: scale(1.08); opacity: 0.72; }
}

@keyframes trail-pulse {
  from { opacity: 0.16; }
  to { opacity: 0.66; }
}

@keyframes ripple-flow {
  0% { transform: scale(0.08); opacity: 0; }
  12% { opacity: 0.62; }
  100% { transform: scale(1.35); opacity: 0; }
}

@keyframes spark-flight {
  0% { transform: translateY(39px) scaleY(0.2); opacity: 0; }
  12% { opacity: 0.95; }
  68% { opacity: 0.58; }
  100% { transform: translateY(0) scaleY(1); opacity: 0; }
}

@keyframes live-pulse {
  from { opacity: 0.38; transform: scale(0.82); }
  to { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .aura,
  .orb-shell,
  .trail-dot,
  .ripple,
  .spark,
  .live-dot {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
</style>
