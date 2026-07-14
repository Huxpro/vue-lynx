<script setup lang="ts">
import {
  computed,
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
  watch,
} from 'vue-lynx';
import {
  resolveSheetDrag,
  sheetDismissThreshold,
  sheetOpenProgress,
  sheetReleaseVelocity,
  shouldClaimSheetGesture,
  shouldDismissSheet,
  smoothSheetVelocity,
  stepSheetSpring,
} from './gesture';
import type { SheetGestureSource } from './gesture';

interface TouchPoint {
  clientX?: number;
  clientY?: number;
}

interface SheetTouchEvent {
  detail?: { x?: number; y?: number };
  touches?: TouchPoint[];
}

interface SheetScrollEvent {
  detail?: { scrollTop?: number };
}

interface SheetLayoutEvent {
  detail?: { height?: number };
  params?: { height?: number };
}

interface MainThreadElement {
  setStyleProperty?: (name: string, value: string) => void;
}

const props = withDefaults(defineProps<{
  modelValue: boolean;
  bottomInset?: number;
  topInset?: number;
  dismissDistance?: number;
}>(), {
  bottomInset: 0,
  topInset: 0,
  dismissDistance: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const surfaceRef = useMainThreadRef<MainThreadElement | null>(null);
const backdropRef = useMainThreadRef<MainThreadElement | null>(null);
const surfaceHeightRef = useMainThreadRef(0);
const touchStartXRef = useMainThreadRef(0);
const touchStartYRef = useMainThreadRef(0);
const touchStartTranslationRef = useMainThreadRef(0);
const lastTouchYRef = useMainThreadRef(0);
const lastTouchTimeRef = useMainThreadRef(0);
const translationRef = useMainThreadRef(0);
const velocityRef = useMainThreadRef(0);
const scrollTopRef = useMainThreadRef(0);
const gestureSourceRef = useMainThreadRef<SheetGestureSource>('content');
const gestureLockedRef = useMainThreadRef(false);
const gestureRejectedRef = useMainThreadRef(false);
const animationFrameRef = useMainThreadRef(0);
const animationGenerationRef = useMainThreadRef(0);

const layerStyle = computed(() => ({ bottom: `${props.bottomInset}px` }));
const surfaceStyle = computed(() => ({
  height: `calc(100% - ${props.topInset}px)`,
}));

function requestClose() {
  emit('update:modelValue', false);
}

function touchX(event: SheetTouchEvent): number {
  'main thread';
  return event.detail?.x ?? event.touches?.[0]?.clientX ?? 0;
}

function touchY(event: SheetTouchEvent): number {
  'main thread';
  return event.detail?.y ?? event.touches?.[0]?.clientY ?? 0;
}

function setMotionTransition(value: string) {
  'main thread';
  surfaceRef.current?.setStyleProperty?.('transition', value);
  backdropRef.current?.setStyleProperty?.('transition', value);
}

function applySheetMotion(translation: number) {
  'main thread';
  const sheetSize = surfaceHeightRef.current > 0
    ? surfaceHeightRef.current
    : 640;
  const progress = sheetOpenProgress(translation, sheetSize);

  translationRef.current = translation;
  surfaceRef.current?.setStyleProperty?.(
    'transform',
    `translateY(${translation}px)`,
  );
  backdropRef.current?.setStyleProperty?.('opacity', String(progress));
}

function cancelSettle() {
  'main thread';
  animationGenerationRef.current += 1;
  if (animationFrameRef.current !== 0) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
  }
}

function resetGestureState() {
  'main thread';
  gestureLockedRef.current = false;
  gestureRejectedRef.current = false;
  velocityRef.current = 0;
}

function finishSettle(target: number, dismiss: boolean, generation: number) {
  'main thread';
  if (generation !== animationGenerationRef.current)
    return;

  animationFrameRef.current = 0;
  velocityRef.current = 0;
  applySheetMotion(target);
  resetGestureState();

  if (dismiss) {
    runOnBackground(requestClose)();
  }
  else {
    setMotionTransition('');
  }
}

function animateSheetTo(target: number, dismiss: boolean) {
  'main thread';
  cancelSettle();
  const generation = animationGenerationRef.current;
  setMotionTransition('none');

  let lastFrameTime = 0;
  function step(frameTime: number) {
    if (generation !== animationGenerationRef.current)
      return;

    const deltaSeconds = lastFrameTime === 0
      ? 1 / 60
      : (frameTime - lastFrameTime) / 1000;
    lastFrameTime = frameTime;

    const next = stepSheetSpring(
      translationRef.current,
      velocityRef.current,
      target,
      deltaSeconds,
    );
    velocityRef.current = next.velocity;
    applySheetMotion(next.value);

    if (
      Math.abs(next.value - target) < 0.5
      && Math.abs(next.velocity) < 0.5
    ) {
      finishSettle(target, dismiss, generation);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(step);
  }

  animationFrameRef.current = requestAnimationFrame(step);
}

function beginGesture(source: SheetGestureSource, event: SheetTouchEvent) {
  'main thread';
  const x = touchX(event);
  const y = touchY(event);
  touchStartXRef.current = x;
  touchStartYRef.current = y;
  touchStartTranslationRef.current = translationRef.current;
  lastTouchYRef.current = y;
  lastTouchTimeRef.current = Date.now();
  gestureSourceRef.current = source;
  resetGestureState();
}

function handleHandleTouchStart(event: SheetTouchEvent) {
  'main thread';
  beginGesture('handle', event);
}

function handleContentTouchStart(event: SheetTouchEvent) {
  'main thread';
  beginGesture('content', event);
}

function handlePanelScroll(event: SheetScrollEvent) {
  'main thread';
  scrollTopRef.current = event.detail?.scrollTop ?? 0;
}

function handleSurfaceLayout(event: SheetLayoutEvent) {
  'main thread';
  surfaceHeightRef.current = event.detail?.height ?? event.params?.height ?? 0;
}

function handleTouchMove(event: SheetTouchEvent) {
  'main thread';
  if (gestureRejectedRef.current)
    return;

  const x = touchX(event);
  const y = touchY(event);
  const deltaX = x - touchStartXRef.current;
  const deltaY = y - touchStartYRef.current;

  if (!gestureLockedRef.current) {
    if (shouldClaimSheetGesture(
      gestureSourceRef.current,
      deltaX,
      deltaY,
      scrollTopRef.current,
    )) {
      cancelSettle();
      setMotionTransition('none');
      gestureLockedRef.current = true;
    }
    else if (
      Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      >= 8
    ) {
      gestureRejectedRef.current = true;
      return;
    }
  }

  if (!gestureLockedRef.current)
    return;

  const now = Date.now();
  velocityRef.current = smoothSheetVelocity(
    velocityRef.current,
    y - lastTouchYRef.current,
    now - lastTouchTimeRef.current,
  );
  lastTouchYRef.current = y;
  lastTouchTimeRef.current = now;

  const translation = resolveSheetDrag(
    touchStartTranslationRef.current + deltaY,
  );
  applySheetMotion(translation);
}

function handleTouchEnd() {
  'main thread';
  if (!gestureLockedRef.current) {
    resetGestureState();
    return;
  }

  const downwardDistance = Math.max(0, translationRef.current);
  const sheetSize = surfaceHeightRef.current > 0
    ? surfaceHeightRef.current
    : 640;
  const dismiss = shouldDismissSheet(
    downwardDistance,
    sheetReleaseVelocity(
      velocityRef.current,
      Date.now() - lastTouchTimeRef.current,
    ),
    sheetDismissThreshold(sheetSize, props.dismissDistance),
  );
  const dismissTarget = sheetSize + 32;
  animateSheetTo(dismiss ? dismissTarget : 0, dismiss);
  gestureLockedRef.current = false;
  gestureRejectedRef.current = false;
}

function handleTouchCancel() {
  'main thread';
  if (gestureLockedRef.current)
    animateSheetTo(0, false);
  else
    resetGestureState();
}

function resetSheetMotion() {
  'main thread';
  cancelSettle();
  setMotionTransition('none');
  applySheetMotion(0);
  resetGestureState();
  setMotionTransition('');
}

function prepareSheetForOpen() {
  'main thread';
  if (
    animationFrameRef.current === 0
    && Math.abs(translationRef.current) < 0.5
  ) {
    return;
  }

  resetSheetMotion();
}

watch(() => props.modelValue, (visible) => {
  if (visible)
    runOnMainThread(prepareSheetForOpen)();
});

function handleAfterLeave() {
  runOnMainThread(resetSheetMotion)();
}
</script>

<template>
  <Transition name="sheet" @after-leave="handleAfterLeave">
    <view v-show="modelValue" class="sheet-layer" :style="layerStyle">
      <view
        class="sheet-backdrop"
        :main-thread-ref="backdropRef"
        @tap="requestClose"
      />
      <view
        class="sheet-surface"
        :style="surfaceStyle"
        :main-thread-ref="surfaceRef"
        :main-thread-bindlayoutchange="handleSurfaceLayout"
      >
        <view class="sheet-rubber-fill" />
        <view
          class="sheet-handle-hit-area"
          :main-thread-bindtouchstart="handleHandleTouchStart"
          :main-thread-bindtouchmove="handleTouchMove"
          :main-thread-bindtouchend="handleTouchEnd"
          :main-thread-bindtouchcancel="handleTouchCancel"
        >
          <view class="sheet-handle" />
        </view>
        <scroll-view
          class="sheet-panel"
          scroll-orientation="vertical"
          :main-thread-bindscroll="handlePanelScroll"
          :main-thread-bindtouchstart="handleContentTouchStart"
          :main-thread-bindtouchmove="handleTouchMove"
          :main-thread-bindtouchend="handleTouchEnd"
          :main-thread-bindtouchcancel="handleTouchCancel"
        >
          <slot />
        </scroll-view>
      </view>
    </view>
  </Transition>
</template>

<style>
.sheet-layer {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 1;
  transition: opacity 250ms cubic-bezier(0.25, 1, 0.5, 1);
}

.sheet-backdrop {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
  transition: opacity 250ms cubic-bezier(0.25, 1, 0.5, 1);
}

.sheet-surface {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  border-top: 1px solid var(--c-border);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background-color: var(--c-sheet-bg);
  transform: translateY(0);
  transition: transform 250ms cubic-bezier(0.25, 1, 0.5, 1);
}

.sheet-rubber-fill {
  position: absolute;
  right: 0;
  bottom: -80px;
  left: 0;
  height: 80px;
  background-color: var(--c-sheet-bg);
}

.sheet-handle-hit-area {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  background-color: var(--c-sheet-bg);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--c-text-secondary);
  opacity: 0.38;
}

.sheet-panel {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  min-height: 0;
  background-color: var(--c-sheet-bg);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet-surface,
.sheet-leave-to .sheet-surface {
  transform: translateY(100%);
}

.sheet-leave-active {
  transition-duration: 188ms;
  transition-timing-function: ease-in;
}

.sheet-leave-active .sheet-backdrop {
  transition-duration: 188ms;
  transition-timing-function: ease-in;
}

.sheet-leave-active .sheet-surface {
  transition-duration: 188ms;
  transition-timing-function: ease-in;
}
</style>
