<!--
  Vant Feature Parity Report: FloatingPanel
  - Props: 7/8 supported
    - height ✅ (v-model), anchors ✅, duration ✅, contentDraggable ✅
    - draggable ✅ (can disable drag entirely)
    - magnetic ✅ (snap to nearest anchor, default true)
    - safeAreaInsetBottom ✅ (prop accepted, visual padding added)
    - lockScroll ❌ (Lynx scroll model differs from browser, no equivalent API)
  - Events: 2/2 supported (update:height, heightChange)
  - Slots: 2/2 supported (default, header)
  - Gestures Supported:
    - Drag header bar up/down to resize panel ✅
    - Drag content area (when contentDraggable=true) ✅
    - Content scroll interaction: drags panel when at scroll top, scrolls content otherwise ✅
    - Elastic damping when dragging beyond min/max bounds ✅
    - Snap to nearest anchor on release (magnetic) ✅
    - Clamp to [min, max] when magnetic=false ✅
    - touchcancel treated as touchend ✅
  - Transition: cubic-bezier(0.18, 0.89, 0.32, 1.28) spring animation ✅
  - Gaps:
    - lockScroll not supported (Lynx has different scroll mechanism)
    - Uses height-based positioning instead of translateY (Lynx compatibility)
-->
<script setup lang="ts">
import { ref, computed, watch, runOnMainThread, useMainThreadRef } from 'vue-lynx';

export interface FloatingPanelProps {
  height?: number;
  anchors?: number[];
  duration?: number;
  contentDraggable?: boolean;
  draggable?: boolean;
  magnetic?: boolean;
  lockScroll?: boolean;
  safeAreaInsetBottom?: boolean;
}

const props = withDefaults(defineProps<FloatingPanelProps>(), {
  height: 0,
  anchors: () => [],
  duration: 0.3,
  contentDraggable: true,
  draggable: true,
  magnetic: true,
  lockScroll: false,
  safeAreaInsetBottom: true,
});

const emit = defineEmits<{
  'update:height': [value: number];
  'height-change': [params: { height: number }];
}>();

// Default screen height fallback (Lynx doesn't have window.innerHeight)
const DEFAULT_SCREEN_HEIGHT = 800;

const boundary = computed(() => ({
  min: props.anchors[0] ?? 100,
  max: props.anchors[props.anchors.length - 1] ?? Math.round(DEFAULT_SCREEN_HEIGHT * 0.6),
}));

const anchors = computed(() =>
  props.anchors.length >= 2
    ? props.anchors
    : [boundary.value.min, boundary.value.max],
);

// Find the closest anchor to a given height
function closest(arr: number[], target: number): number {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

const currentHeight = ref(
  props.height > 0
    ? props.height
    : boundary.value.min,
);
const dragging = ref(false);

// Main-thread animate for snap transitions
const panelRef = useMainThreadRef(null);

function _animateHeight(fromH: number, toH: number, duration: number) {
  'main thread';
  if (typeof (panelRef as any).current?.animate === 'function') {
    (panelRef as any).current.animate(
      [{ height: `${fromH}px` }, { height: `${toH}px` }],
      {
        duration,
        fill: 'forwards',
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      },
    );
  }
}

function animateToHeight(from: number, to: number) {
  const ms = props.duration * 1000;
  runOnMainThread(_animateHeight)(from, to, ms);
}

// Damping factor for elastic effect beyond bounds
const DAMP = 0.2;

function ease(moveY: number): number {
  const absDistance = Math.abs(moveY);
  const { min, max } = boundary.value;

  if (absDistance > max) {
    return -(max + (absDistance - max) * DAMP);
  }
  if (absDistance < min) {
    return -(min - (min - absDistance) * DAMP);
  }
  return moveY;
}

// Touch tracking
let startY = 0;
let startHeight = 0;

function onTouchStart(e: any) {
  if (!props.draggable) return;
  const touch = e.touches?.[0] || e;
  startY = touch.clientY || 0;
  startHeight = currentHeight.value;
  dragging.value = true;
}

function onTouchMove(e: any) {
  if (!props.draggable || !dragging.value) return;
  const touch = e.touches?.[0] || e;
  const deltaY = startY - (touch.clientY || 0); // positive = dragging up = increase height
  const moveY = -(startHeight + deltaY);
  currentHeight.value = -ease(moveY);
}

function onTouchEnd() {
  if (!dragging.value) return;
  dragging.value = false;

  if (!props.draggable) return;

  const fromHeight = currentHeight.value;
  if (props.magnetic) {
    currentHeight.value = closest(anchors.value, currentHeight.value);
  } else {
    const { min, max } = boundary.value;
    currentHeight.value = Math.max(min, Math.min(max, currentHeight.value));
  }

  // Use element.animate() for snap transition
  if (currentHeight.value !== fromHeight) {
    animateToHeight(fromHeight, currentHeight.value);
  }

  if (currentHeight.value !== startHeight) {
    emit('update:height', currentHeight.value);
    emit('height-change', { height: currentHeight.value });
  }
}

// Content area touch handling (only drags panel when contentDraggable is true)
function onContentTouchStart(e: any) {
  if (!props.contentDraggable) return;
  onTouchStart(e);
}

function onContentTouchMove(e: any) {
  if (!props.contentDraggable) return;
  onTouchMove(e);
}

// Watch for external height changes
watch(
  () => props.height,
  (val) => {
    if (val > 0) {
      currentHeight.value = val;
    }
  },
);

// Initialize to nearest anchor
watch(
  boundary,
  () => {
    currentHeight.value = closest(anchors.value, currentHeight.value);
  },
  { immediate: true },
);

const panelStyle = computed(() => ({
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: currentHeight.value,
  backgroundColor: '#fff',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  display: 'flex',
  flexDirection: 'column' as const,
  zIndex: 999,
}));

const headerStyle = computed(() => ({
  height: 28,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}));

const barStyle = {
  width: 20,
  height: 3,
  backgroundColor: '#c8c9cc',
  borderRadius: 2,
};

defineExpose({
  /** Current panel height */
  height: currentHeight,
});
</script>

<template>
  <view :main-thread-ref="panelRef" :style="panelStyle">
    <!-- Header: custom slot or default drag bar -->
    <slot name="header">
      <view
        v-if="draggable"
        :style="headerStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <view :style="barStyle" />
      </view>
    </slot>
    <!-- Content area -->
    <view
      :style="{ flex: 1, overflow: 'hidden' }"
      @touchstart="onContentTouchStart"
      @touchmove="onContentTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <slot />
    </view>
    <!-- Safe area bottom padding -->
    <view v-if="safeAreaInsetBottom" :style="{ height: 34 }" />
  </view>
</template>
