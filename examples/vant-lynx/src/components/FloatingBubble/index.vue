<!--
  Lynx Limitations:
  - teleport: Lynx has no DOM tree to teleport to; prop accepted for API compat but ignored
  - cursor/user-select: no mouse interaction in Lynx; touch-action handled via touch events
  - :active pseudo-class: Lynx has no :active; could add touchstart opacity if needed
  - window.innerWidth/innerHeight: Lynx has no window; uses screenWidth/screenHeight props
  - getBoundingClientRect: Lynx uses SelectorQuery; bubble size from CSS var default (48px)
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import { useTouch } from '../../composables/useTouch';
import Icon from '../Icon/index.vue';
import './index.less';

import type {
  FloatingBubbleAxis,
  FloatingBubbleMagnetic,
  FloatingBubbleOffset,
  FloatingBubbleGap,
  FloatingBubbleBoundary,
} from './types';

export type {
  FloatingBubbleAxis,
  FloatingBubbleMagnetic,
  FloatingBubbleOffset,
  FloatingBubbleGap,
} from './types';

export interface FloatingBubbleProps {
  gap?: FloatingBubbleGap;
  icon?: string;
  axis?: FloatingBubbleAxis;
  magnetic?: FloatingBubbleMagnetic;
  offset?: FloatingBubbleOffset;
  teleport?: string;
  /** Lynx-specific: screen width for boundary calculation */
  screenWidth?: number;
  /** Lynx-specific: screen height for boundary calculation */
  screenHeight?: number;
}

const [, bem] = createNamespace('floating-bubble');

const props = withDefaults(defineProps<FloatingBubbleProps>(), {
  gap: 24,
  icon: '',
  axis: 'y',
  teleport: 'body',
  screenWidth: 375,
  screenHeight: 812,
});

const emit = defineEmits<{
  click: [e?: any];
  'update:offset': [value: FloatingBubbleOffset];
  offsetChange: [value: FloatingBubbleOffset];
}>();

const BUBBLE_SIZE = 48;

// Computed gap values (support number or {x, y} object)
const gapX = computed(() =>
  typeof props.gap === 'object' ? props.gap.x : props.gap,
);
const gapY = computed(() =>
  typeof props.gap === 'object' ? props.gap.y : props.gap,
);

const boundary = computed<FloatingBubbleBoundary>(() => ({
  top: gapY.value,
  right: props.screenWidth - BUBBLE_SIZE - gapX.value,
  bottom: props.screenHeight - BUBBLE_SIZE - gapY.value,
  left: gapX.value,
}));

function closest(arr: number[], target: number): number {
  return arr.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
  );
}

const state = ref({
  x: props.offset ? props.offset.x : props.screenWidth - BUBBLE_SIZE - gapX.value,
  y: props.offset ? props.offset.y : props.screenHeight - BUBBLE_SIZE - gapY.value,
  width: BUBBLE_SIZE,
  height: BUBBLE_SIZE,
});

const dragging = ref(false);
let initialized = false;

const rootStyle = computed(() => {
  const style: Record<string, any> = {};
  const x = addUnit(state.value.x);
  const y = addUnit(state.value.y);
  style.transform = `translate3d(${x}, ${y}, 0)`;

  if (dragging.value || !initialized) {
    style.transitionProperty = 'none';
  }

  return style;
});

const touch = useTouch();
let prevX = 0;
let prevY = 0;

function onTouchStart(e: any) {
  touch.start(e);
  dragging.value = true;
  prevX = state.value.x;
  prevY = state.value.y;
}

function onTouchMove(e: any) {
  touch.move(e);

  if (props.axis === 'lock') return;

  if (!touch.isTap.value) {
    if (props.axis === 'x' || props.axis === 'xy') {
      let nextX = prevX + touch.deltaX.value;
      if (nextX < boundary.value.left) nextX = boundary.value.left;
      if (nextX > boundary.value.right) nextX = boundary.value.right;
      state.value.x = nextX;
    }

    if (props.axis === 'y' || props.axis === 'xy') {
      let nextY = prevY + touch.deltaY.value;
      if (nextY < boundary.value.top) nextY = boundary.value.top;
      if (nextY > boundary.value.bottom) nextY = boundary.value.bottom;
      state.value.y = nextY;
    }

    const offset: FloatingBubbleOffset = { x: state.value.x, y: state.value.y };
    emit('update:offset', offset);
  }
}

function onTouchEnd() {
  dragging.value = false;

  nextTick(() => {
    if (props.magnetic === 'x') {
      const nextX = closest(
        [boundary.value.left, boundary.value.right],
        state.value.x,
      );
      state.value.x = nextX;
    }
    if (props.magnetic === 'y') {
      const nextY = closest(
        [boundary.value.top, boundary.value.bottom],
        state.value.y,
      );
      state.value.y = nextY;
    }

    if (!touch.isTap.value) {
      const offset: FloatingBubbleOffset = { x: state.value.x, y: state.value.y };
      emit('update:offset', offset);
      if (prevX !== offset.x || prevY !== offset.y) {
        emit('offsetChange', offset);
      }
    }
  });
}

function onClick() {
  if (touch.isTap.value) {
    emit('click');
  }
}

const updateState = () => {
  const { offset } = props;
  state.value = {
    x: offset ? offset.x : props.screenWidth - BUBBLE_SIZE - gapX.value,
    y: offset ? offset.y : props.screenHeight - BUBBLE_SIZE - gapY.value,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
  };
};

onMounted(() => {
  updateState();
  nextTick(() => {
    initialized = true;
  });
});

// Watch for external offset/gap/screen changes
watch(
  [gapX, gapY, () => props.offset, () => props.screenWidth, () => props.screenHeight],
  updateState,
  { deep: true },
);

defineExpose({
  offset: computed(() => ({ x: state.value.x, y: state.value.y })),
});
</script>

<template>
  <view
    :class="bem()"
    :style="rootStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @tap="onClick"
  >
    <slot>
      <Icon v-if="icon" :name="icon" :class="bem('icon')" />
    </slot>
  </view>
</template>
