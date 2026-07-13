<script setup lang="ts">
import { computed, runOnBackground, useMainThreadRef } from 'vue-lynx';
import {
  SHEET_GESTURE_LOCK_DISTANCE,
  clampDownwardDrag,
  isDownwardSheetGesture,
  shouldDismissSheet,
} from './gesture';

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
  dismissDistance: 120,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const panelRef = useMainThreadRef<MainThreadElement | null>(null);
const touchStartXRef = useMainThreadRef(0);
const touchStartYRef = useMainThreadRef(0);
const dragDistanceRef = useMainThreadRef(0);
const scrollTopRef = useMainThreadRef(0);
const gestureLockedRef = useMainThreadRef(false);
const gestureRejectedRef = useMainThreadRef(false);

const layerStyle = computed(() => ({ bottom: `${props.bottomInset}px` }));
const panelStyle = computed(() => ({
  maxHeight: `calc(100% - ${props.topInset}px)`,
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

function setPanelMotion(transform: string, transition: string) {
  'main thread';
  const panel = panelRef.current;
  panel?.setStyleProperty?.('transition', transition);
  panel?.setStyleProperty?.('transform', transform);
}

function resetGesture() {
  'main thread';
  dragDistanceRef.current = 0;
  gestureLockedRef.current = false;
  gestureRejectedRef.current = false;
}

function handlePanelScroll(event: SheetScrollEvent) {
  'main thread';
  scrollTopRef.current = event.detail?.scrollTop ?? 0;
}

function handleTouchStart(event: SheetTouchEvent) {
  'main thread';
  touchStartXRef.current = touchX(event);
  touchStartYRef.current = touchY(event);
  resetGesture();
}

function handleTouchMove(event: SheetTouchEvent) {
  'main thread';
  if (gestureRejectedRef.current || scrollTopRef.current > 0)
    return;

  const deltaX = touchX(event) - touchStartXRef.current;
  const deltaY = touchY(event) - touchStartYRef.current;

  if (!gestureLockedRef.current) {
    if (isDownwardSheetGesture(deltaX, deltaY)) {
      gestureLockedRef.current = true;
    }
    else if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) >= SHEET_GESTURE_LOCK_DISTANCE) {
      gestureRejectedRef.current = true;
      return;
    }
  }

  if (!gestureLockedRef.current)
    return;

  const distance = clampDownwardDrag(deltaY);
  dragDistanceRef.current = distance;
  setPanelMotion(`translateY(${distance}px)`, 'none');
}

function handleTouchEnd() {
  'main thread';
  if (!gestureLockedRef.current) {
    resetGesture();
    return;
  }

  const shouldDismiss = shouldDismissSheet(
    dragDistanceRef.current,
    props.dismissDistance,
  );
  if (shouldDismiss) {
    setPanelMotion('translateY(100%)', 'transform 188ms ease-in');
    runOnBackground(requestClose)();
  }
  else {
    setPanelMotion('translateY(0px)', 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)');
  }
  resetGesture();
}

function handleTouchCancel() {
  'main thread';
  setPanelMotion('translateY(0px)', 'transform 188ms ease-out');
  resetGesture();
}
</script>

<template>
  <Transition name="sheet">
    <view v-show="modelValue" class="sheet-layer" :style="layerStyle">
      <view class="sheet-backdrop" @tap="requestClose" />
      <scroll-view
        class="sheet-panel"
        :style="panelStyle"
        scroll-orientation="vertical"
        :main-thread-ref="panelRef"
        :main-thread-bindscroll="handlePanelScroll"
        :main-thread-bindtouchstart="handleTouchStart"
        :main-thread-bindtouchmove="handleTouchMove"
        :main-thread-bindtouchend="handleTouchEnd"
        :main-thread-bindtouchcancel="handleTouchCancel"
      >
        <slot />
      </scroll-view>
    </view>
  </Transition>
</template>

<style>
.sheet-layer {
  position: absolute;
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
}

.sheet-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  border-top: 1px solid var(--c-border);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background-color: var(--c-sheet-bg);
  transform: translateY(0);
  transition: transform 250ms cubic-bezier(0.25, 1, 0.5, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}

.sheet-leave-active {
  transition-duration: 188ms;
  transition-timing-function: ease-in;
}

.sheet-leave-active .sheet-panel {
  transition-duration: 188ms;
  transition-timing-function: ease-in;
}
</style>
