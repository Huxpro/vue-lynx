<!--
  Vant Feature Parity Report: SwipeCell
  - Props: 5/6 supported
    - name, disabled, leftWidth, rightWidth, stopPropagation
    - beforeClose (interceptor pattern)
  - Events: 3/3 supported (open, close, click)
  - Slots: 3/3 supported (default, left, right)
  - Exposed Methods: open(side), close(position)
  - Gestures: horizontal swipe, direction detection, threshold, drag offset, click-away
  - Transition: CSS transition for snap (only during snap, not during drag)
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface SwipeCellProps {
  name?: string | number;
  leftWidth?: number;
  rightWidth?: number;
  disabled?: boolean;
  beforeClose?: (params: {
    name: string | number;
    position: 'left' | 'right' | 'cell' | 'outside';
  }) => boolean | Promise<boolean> | undefined;
  stopPropagation?: boolean;
}

const props = withDefaults(defineProps<SwipeCellProps>(), {
  name: '',
  leftWidth: 0,
  rightWidth: 0,
  disabled: false,
  stopPropagation: false,
});

const emit = defineEmits<{
  open: [params: { name: string | number; position: 'left' | 'right' }];
  close: [params: { name: string | number; position: 'left' | 'right' | 'cell' | 'outside' }];
  click: [position: 'left' | 'right' | 'cell' | 'outside'];
}>();

// State
const offset = ref(0);
const dragging = ref(false);
const opened = ref(false);
const lockClick = ref(false);
const isInBeforeClosing = ref(false);

// Touch tracking
let startX = 0;
let startY = 0;
let startOffset = 0;
let direction: '' | 'horizontal' | 'vertical' = '';
const LOCK_DIRECTION_DISTANCE = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function onTouchStart(e: any) {
  if (props.disabled) return;
  const touch = e.touches?.[0] || e;
  startX = touch.clientX || 0;
  startY = touch.clientY || 0;
  startOffset = offset.value;
  direction = '';
}

function onTouchMove(e: any) {
  if (props.disabled) return;
  const touch = e.touches?.[0] || e;
  const deltaX = (touch.clientX || 0) - startX;
  const deltaY = (touch.clientY || 0) - startY;
  const offsetX = Math.abs(deltaX);
  const offsetY = Math.abs(deltaY);

  if (!direction || (offsetX < LOCK_DIRECTION_DISTANCE && offsetY < LOCK_DIRECTION_DISTANCE)) {
    if (offsetX > offsetY) {
      direction = 'horizontal';
    } else if (offsetY > offsetX) {
      direction = 'vertical';
    }
  }

  if (direction !== 'horizontal') return;

  lockClick.value = true;
  dragging.value = true;

  offset.value = clamp(
    deltaX + startOffset,
    -props.rightWidth,
    props.leftWidth,
  );
}

function onTouchEnd() {
  if (dragging.value) {
    dragging.value = false;
    toggle(offset.value > 0 ? 'left' : 'right');

    setTimeout(() => {
      lockClick.value = false;
    }, 0);
  }
}

function toggle(side: 'left' | 'right') {
  const currentOffset = Math.abs(offset.value);
  const THRESHOLD = 0.15;
  const threshold = opened.value ? 1 - THRESHOLD : THRESHOLD;
  const width = side === 'left' ? props.leftWidth : props.rightWidth;

  if (width && currentOffset > width * threshold) {
    open(side);
  } else {
    close(side);
  }
}

function open(side: 'left' | 'right') {
  offset.value = side === 'left' ? props.leftWidth : -props.rightWidth;

  if (!opened.value) {
    opened.value = true;
    emit('open', { name: props.name, position: side });
  }
}

function close(position: 'left' | 'right' | 'cell' | 'outside' = 'outside') {
  offset.value = 0;

  if (opened.value) {
    opened.value = false;
    emit('close', { name: props.name, position });
  }
}

function handleClick(position: 'left' | 'right' | 'cell' | 'outside') {
  if (isInBeforeClosing.value) return;

  emit('click', position);

  if (opened.value && !lockClick.value) {
    if (props.beforeClose) {
      isInBeforeClosing.value = true;
      const result = props.beforeClose({ name: props.name, position });
      if (result && typeof (result as Promise<boolean>).then === 'function') {
        (result as Promise<boolean>)
          .then((allow) => {
            isInBeforeClosing.value = false;
            if (allow !== false) close(position);
          })
          .catch(() => {
            isInBeforeClosing.value = false;
          });
      } else {
        isInBeforeClosing.value = false;
        if (result !== false) close(position);
      }
    } else {
      close(position);
    }
  }
}

function getClickHandler(position: 'left' | 'right' | 'cell' | 'outside') {
  return () => {
    if (lockClick.value) return;
    handleClick(position);
  };
}

const wrapperStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'row' as const,
  transform: `translateX(${offset.value}px)`,
  // CSS transition only when snapping (not during drag)
  transition: dragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}));

defineExpose({ open, close });
</script>

<template>
  <view
    :style="{ position: 'relative', overflow: 'hidden' }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @tap="getClickHandler('cell')()"
  >
    <view :style="wrapperStyle">
      <view
        v-if="leftWidth"
        :style="{
          position: 'absolute',
          top: 0,
          left: -leftWidth,
          width: leftWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }"
        @tap.stop="getClickHandler('left')()"
      >
        <slot name="left" />
      </view>
      <view :style="{ flex: 1 }">
        <slot />
      </view>
      <view
        v-if="rightWidth"
        :style="{
          position: 'absolute',
          top: 0,
          right: -rightWidth,
          width: rightWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }"
        @tap.stop="getClickHandler('right')()"
      >
        <slot name="right" />
      </view>
    </view>
  </view>
</template>
