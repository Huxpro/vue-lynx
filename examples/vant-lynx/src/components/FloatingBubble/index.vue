<!--
  Vant Feature Parity Report: FloatingBubble
  - Props: 5/6 supported
    - icon ✅, axis ✅ (x/y/xy/lock), magnetic ✅ (x/y snap to nearest edge)
    - offset ✅ (v-model with {x, y}), gap ✅ (number or {x, y} object)
    - teleport ❌ (Lynx has no DOM, Vue Teleport not applicable)
  - Events: 3/3 supported (click, update:offset, offsetChange)
  - Slots: 1/1 supported (default - custom bubble content)
  - Gestures Supported:
    - Drag freely along configured axis (x, y, xy) ✅
    - Lock mode prevents all dragging ✅
    - Boundary constraints based on gap ✅
    - Magnetic snap to nearest edge on release (x or y axis) ✅
    - Tap vs drag detection (only emits click on tap, not drag) ✅
    - Transition animation when snapping (not during drag) ✅
    - touchcancel treated as touchend ✅
  - Default Position: bottom-right corner with gap offset ✅
  - Gaps:
    - teleport not supported (Lynx has no DOM tree to teleport to)
    - No Icon component integration (uses text fallback for icon prop)
    - Window dimensions use fixed defaults (Lynx has no window.innerWidth/Height);
      provide screenWidth/screenHeight props to customize
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, useMainThreadRef, runOnMainThread } from 'vue-lynx';

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
  /** Screen width for boundary calculation (Lynx has no window.innerWidth) */
  screenWidth?: number;
  /** Screen height for boundary calculation (Lynx has no window.innerHeight) */
  screenHeight?: number;
  /** Bubble size in px */
  size?: number;
  teleport?: string; // accepted but ignored in Lynx
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

// Computed gap values (support number or {x, y} object)
const gapX = computed(() =>
  typeof props.gap === 'object' ? props.gap.x : props.gap,
);
const gapY = computed(() =>
  typeof props.gap === 'object' ? props.gap.y : props.gap,
);

// Boundary constraints
const boundary = computed(() => ({
  top: gapY.value,
  right: props.screenWidth - props.size - gapX.value,
  bottom: props.screenHeight - props.size - gapY.value,
  left: gapX.value,
}));

// Find closest value in array
function closest(arr: number[], target: number): number {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

// Position state - default to bottom-right corner
const posX = ref(
  props.offset ? props.offset.x : props.screenWidth - props.size - gapX.value,
);
const posY = ref(
  props.offset ? props.offset.y : props.screenHeight - props.size - gapY.value,
);

const dragging = ref(false);

// Main-thread animation for snap and appear
const bubbleRef = useMainThreadRef(null);

function _bounceIn(duration: number) {
  'main thread';
  if (typeof (bubbleRef as any).current?.animate === 'function') {
    (bubbleRef as any).current.animate(
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

function _snapTo(fromLeft: number, fromTop: number, toLeft: number, toTop: number, duration: number) {
  'main thread';
  if (typeof (bubbleRef as any).current?.animate === 'function') {
    (bubbleRef as any).current.animate(
      [
        { left: `${fromLeft}px`, top: `${fromTop}px` },
        { left: `${toLeft}px`, top: `${toTop}px` },
      ],
      { duration, fill: 'forwards', easing: 'ease-out' },
    );
  }
}

// Bounce-in animation on first appear
onMounted(() => {
  runOnMainThread(_bounceIn)(200);
});

// Tap detection: if drag distance < TAP_OFFSET, it's a tap, not a drag
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
  isTap = true;
}

function onTouchMove(e: any) {
  if (!dragging.value) return;
  const touch = e.touches?.[0] || e;
  const deltaX = (touch.clientX || 0) - startTouchX;
  const deltaY = (touch.clientY || 0) - startTouchY;

  // Detect if this is still a tap
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

  const fromX = posX.value;
  const fromY = posY.value;

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

  // Animate snap with element.animate()
  if (posX.value !== fromX || posY.value !== fromY) {
    runOnMainThread(_snapTo)(fromX, fromY, posX.value, posY.value, 300);
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

// Watch for external offset changes
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

const bubbleStyle = computed(() => ({
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
}));

defineExpose({
  /** Current position */
  offset: computed(() => ({ x: posX.value, y: posY.value })),
});
</script>

<template>
  <view
    :main-thread-ref="bubbleRef"
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
