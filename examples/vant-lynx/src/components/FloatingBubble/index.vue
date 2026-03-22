<!--
  Vant Feature Parity Report: FloatingBubble
  - Props: 5/6 supported
    - icon, axis (x/y/xy/lock), magnetic (x/y snap to nearest edge)
    - offset (v-model with {x, y}), gap (number or {x, y} object)
    - teleport: N/A (Lynx has no DOM)
  - Events: 3/3 supported (click, update:offset, offsetChange)
  - Slots: 1/1 supported (default - custom bubble content)
  - Gestures: drag along axis, lock mode, boundary constraints, magnetic snap
  - Transition: CSS transition for snap animation, scale appear animation
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue-lynx';

export type FloatingBubbleAxis = 'x' | 'y' | 'xy' | 'lock';
export type FloatingBubbleMagnetic = 'x' | 'y' | '';
export type FloatingBubbleOffset = { x: number; y: number };
export type FloatingBubbleGap = number | { x: number; y: number };

export interface FloatingBubbleProps {
  offset?: FloatingBubbleOffset;
  axis?: FloatingBubbleAxis;
  magnetic?: FloatingBubbleMagnetic;
  icon?: string;
  gap?: FloatingBubbleGap;
  screenWidth?: number;
  screenHeight?: number;
  size?: number;
  teleport?: string;
}

const props = withDefaults(defineProps<FloatingBubbleProps>(), {
  axis: 'y',
  magnetic: '',
  icon: '',
  gap: 24,
  screenWidth: 375,
  screenHeight: 812,
  size: 48,
});

const emit = defineEmits<{
  click: [e?: any];
  'update:offset': [value: FloatingBubbleOffset];
  'offset-change': [value: FloatingBubbleOffset];
}>();

const gapX = computed(() =>
  typeof props.gap === 'object' ? props.gap.x : props.gap,
);
const gapY = computed(() =>
  typeof props.gap === 'object' ? props.gap.y : props.gap,
);

const boundary = computed(() => ({
  top: gapY.value,
  right: props.screenWidth - props.size - gapX.value,
  bottom: props.screenHeight - props.size - gapY.value,
  left: gapX.value,
}));

function closest(arr: number[], target: number): number {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

const posX = ref(
  props.offset ? props.offset.x : props.screenWidth - props.size - gapX.value,
);
const posY = ref(
  props.offset ? props.offset.y : props.screenHeight - props.size - gapY.value,
);

const dragging = ref(false);
// Track whether snap animation is active (enables CSS transition)
const snapping = ref(false);
// Appear animation state
const appeared = ref(false);

// Bounce-in animation on first appear
onMounted(() => {
  // Start scaled down, then animate to full size
  setTimeout(() => {
    appeared.value = true;
  }, 16);
});

// Tap detection
const TAP_OFFSET = 5;
let isTap = true;

// Touch tracking
let startTouchX = 0;
let startTouchY = 0;
let prevX = 0;
let prevY = 0;

function onTouchStart(e: any) {
  const touch = e.touches?.[0] || e;
  startTouchX = touch.clientX || 0;
  startTouchY = touch.clientY || 0;
  prevX = posX.value;
  prevY = posY.value;
  dragging.value = true;
  snapping.value = false;
  isTap = true;
}

function onTouchMove(e: any) {
  if (!dragging.value) return;
  const touch = e.touches?.[0] || e;
  const deltaX = (touch.clientX || 0) - startTouchX;
  const deltaY = (touch.clientY || 0) - startTouchY;

  if (isTap && (Math.abs(deltaX) > TAP_OFFSET || Math.abs(deltaY) > TAP_OFFSET)) {
    isTap = false;
  }

  if (props.axis === 'lock') return;

  if (!isTap) {
    if (props.axis === 'x' || props.axis === 'xy') {
      let nextX = prevX + deltaX;
      nextX = Math.max(boundary.value.left, Math.min(boundary.value.right, nextX));
      posX.value = nextX;
    }

    if (props.axis === 'y' || props.axis === 'xy') {
      let nextY = prevY + deltaY;
      nextY = Math.max(boundary.value.top, Math.min(boundary.value.bottom, nextY));
      posY.value = nextY;
    }

    const offset = { x: posX.value, y: posY.value };
    emit('update:offset', offset);
  }
}

function onTouchEnd() {
  dragging.value = false;

  // Apply magnetic snapping
  if (props.magnetic === 'x') {
    posX.value = closest(
      [boundary.value.left, boundary.value.right],
      posX.value,
    );
  }
  if (props.magnetic === 'y') {
    posY.value = closest(
      [boundary.value.top, boundary.value.bottom],
      posY.value,
    );
  }

  // Enable snap transition if position changed
  if (posX.value !== prevX || posY.value !== prevY) {
    snapping.value = true;
    setTimeout(() => { snapping.value = false; }, 300);
  }

  if (isTap) {
    emit('click');
  } else {
    const offset = { x: posX.value, y: posY.value };
    emit('update:offset', offset);
    if (prevX !== offset.x || prevY !== offset.y) {
      emit('offset-change', offset);
    }
  }
}

watch(
  () => props.offset,
  (val) => {
    if (val) {
      posX.value = val.x;
      posY.value = val.y;
    }
  },
  { deep: true },
);

const bubbleStyle = computed(() => {
  const transitions: string[] = [];
  if (snapping.value) {
    transitions.push('left 0.3s ease-out', 'top 0.3s ease-out');
  }
  if (!appeared.value) {
    transitions.push('transform 0.3s ease-out', 'opacity 0.3s ease-out');
  }

  return {
    position: 'fixed' as const,
    left: posX.value,
    top: posY.value,
    width: props.size,
    height: props.size,
    borderRadius: props.size / 2,
    backgroundColor: '#1989fa',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 999,
    transform: appeared.value ? 'scale(1)' : 'scale(0)',
    opacity: appeared.value ? 1 : 0,
    transition: transitions.length > 0 ? transitions.join(', ') : 'none',
  };
});

defineExpose({
  offset: computed(() => ({ x: posX.value, y: posY.value })),
});
</script>

<template>
  <view
    :style="bubbleStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <slot>
      <text :style="{ fontSize: 20, color: '#fff' }">{{ icon || '\u2605' }}</text>
    </slot>
  </view>
</template>
