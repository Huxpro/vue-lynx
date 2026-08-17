<!--
  Lynx Limitations:
  - lockScroll: Lynx scroll model differs from browser, no equivalent API
  - overflow-y: auto on content: Lynx doesn't support overflow:scroll, content uses flex layout
  - ::after pseudo-element: replaced with <view> for background extension below fold
  - cursor: grab: no cursor support in Lynx
  - user-select: none: no text selection in Lynx
  - -webkit-overflow-scrolling: touch: not applicable in Lynx
  - 100vw width: uses 100% instead (Lynx viewport units may differ)
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import { useTouch } from '../../composables/useTouch';
import './index.less';

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
  heightChange: [params: { height: number }];
}>();

const [, bem] = createNamespace('floating-panel');

// Default screen height fallback (Lynx doesn't have window.innerHeight reliably)
const SCREEN_HEIGHT = 800;
const DAMP = 0.2;

const boundary = computed(() => ({
  min: props.anchors[0] ?? 100,
  max: props.anchors[props.anchors.length - 1] ?? Math.round(SCREEN_HEIGHT * 0.6),
}));

const anchors = computed(() =>
  props.anchors.length >= 2
    ? props.anchors
    : [boundary.value.min, boundary.value.max],
);

function closest(arr: number[], target: number): number {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

// Height state — syncs with v-model:height
const height = ref(+props.height || boundary.value.min);

watch(
  () => props.height,
  (val) => {
    if (val !== undefined && +val !== height.value) {
      height.value = +val;
    }
  },
);

const dragging = ref(false);

// Use translateY for GPU-composited animation (matches Vant exactly)
const rootStyle = computed(() => ({
  height: addUnit(boundary.value.max),
  transform: `translateY(calc(100% + ${addUnit(-height.value)}))`,
  transition: !dragging.value
    ? `transform ${props.duration}s cubic-bezier(0.18, 0.89, 0.32, 1.28)`
    : 'none',
}));

const contentStyle = computed(() => ({
  paddingBottom: addUnit(boundary.value.max - height.value),
}));

const ease = (moveY: number): number => {
  const absDistance = Math.abs(moveY);
  const { min, max } = boundary.value;

  if (absDistance > max) {
    return -(max + (absDistance - max) * DAMP);
  }
  if (absDistance < min) {
    return -(min - (min - absDistance) * DAMP);
  }
  return moveY;
};

let startY: number;
const touch = useTouch();

function handleTouchStart(e: TouchEvent) {
  if (!props.draggable) return;
  touch.start(e);
  dragging.value = true;
  startY = -height.value;
}

function handleTouchMove(e: TouchEvent) {
  if (!props.draggable || !dragging.value) return;
  touch.move(e);

  const moveY = touch.deltaY.value + startY;
  height.value = -ease(moveY);
}

function handleTouchEnd() {
  if (!dragging.value) return;
  dragging.value = false;

  if (!props.draggable) return;

  if (props.magnetic) {
    height.value = closest(anchors.value, height.value);
  } else {
    const { min, max } = boundary.value;
    height.value = Math.max(min, Math.min(max, height.value));
  }

  if (height.value !== -startY) {
    emit('update:height', height.value);
    emit('heightChange', { height: height.value });
  }
}

// Content touch handlers: only active when contentDraggable is true
function onContentTouchStart(e: TouchEvent) {
  if (!props.contentDraggable) return;
  handleTouchStart(e);
}

function onContentTouchMove(e: TouchEvent) {
  if (!props.contentDraggable) return;
  handleTouchMove(e);
}

function onContentTouchEnd() {
  if (!props.contentDraggable) return;
  handleTouchEnd();
}

// Initialize to nearest anchor
watch(
  boundary,
  () => {
    height.value = closest(anchors.value, height.value);
  },
  { immediate: true },
);

defineExpose({
  height,
});
</script>

<template>
  <view
    :class="[bem(), { 'van-safe-area-bottom': safeAreaInsetBottom }]"
    :style="rootStyle"
  >
    <!-- Header: custom slot or default drag bar -->
    <slot name="header">
      <view
        v-if="draggable"
        :class="bem('header')"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >
        <view :class="bem('header-bar')" />
      </view>
    </slot>

    <!-- Content area -->
    <view
      :class="bem('content')"
      :style="contentStyle"
      @touchstart="onContentTouchStart"
      @touchmove="onContentTouchMove"
      @touchend="onContentTouchEnd"
      @touchcancel="onContentTouchEnd"
    >
      <slot />
    </view>

    <!-- Background extension (replaces ::after in Vant) -->
    <view :style="{
      position: 'absolute',
      bottom: '-100vh',
      height: '100vh',
      width: '100%',
      backgroundColor: 'inherit',
    }" />
  </view>
</template>
