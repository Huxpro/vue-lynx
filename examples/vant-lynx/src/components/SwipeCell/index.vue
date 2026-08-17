<!--
  Lynx Limitations:
  - Auto-width measurement: Lynx has no synchronous getBoundingClientRect;
    leftWidth/rightWidth must be provided as props (no auto-calc from slot content)
  - useClickAway: No document-level touchstart listener in Lynx;
    outside clicks are not auto-detected (user must call close() manually)
  - stopPropagation: Limited to Lynx event model (bindtap vs DOM events)
  - cursor: grab: No cursor in Lynx (mobile only)
-->
<script setup lang="ts">
import { ref, reactive, computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef, clamp } from '../../utils/format';
import { useTouch } from '../../composables/useTouch';
import './index.less';

import type { SwipeCellSide, SwipeCellPosition, SwipeCellProps } from './types';

const [, bem] = createNamespace('swipe-cell');

const props = withDefaults(defineProps<SwipeCellProps>(), {
  name: '',
  disabled: false,
  stopPropagation: false,
});

const emit = defineEmits<{
  open: [params: { name: string | number; position: SwipeCellSide }];
  close: [params: { name: string | number; position: SwipeCellPosition }];
  click: [position: SwipeCellPosition];
}>();

let opened = false;
let lockClick = false;
let startOffset = 0;
let isInBeforeClosing = false;

const state = reactive({
  offset: 0,
  dragging: false,
});

const touch = useTouch();

const leftWidth = computed(() =>
  isDef(props.leftWidth) ? +props.leftWidth : 0,
);

const rightWidth = computed(() =>
  isDef(props.rightWidth) ? +props.rightWidth : 0,
);

const open = (side: SwipeCellSide) => {
  state.offset = side === 'left' ? leftWidth.value : -rightWidth.value;

  if (!opened) {
    opened = true;
    emit('open', {
      name: props.name,
      position: side,
    });
  }
};

const close = (position?: SwipeCellPosition) => {
  state.offset = 0;

  if (opened) {
    opened = false;
    emit('close', {
      name: props.name,
      position: position!,
    });
  }
};

const toggle = (side: SwipeCellSide) => {
  const offset = Math.abs(state.offset);
  const THRESHOLD = 0.15;
  const threshold = opened ? 1 - THRESHOLD : THRESHOLD;
  const width = side === 'left' ? leftWidth.value : rightWidth.value;

  if (width && offset > width * threshold) {
    open(side);
  } else {
    close(side);
  }
};

const onTouchStart = (event: TouchEvent) => {
  if (!props.disabled) {
    startOffset = state.offset;
    touch.start(event);
  }
};

const onTouchMove = (event: TouchEvent) => {
  if (props.disabled) return;

  const { deltaX } = touch;
  touch.move(event);

  if (touch.isHorizontal()) {
    lockClick = true;
    state.dragging = true;

    state.offset = clamp(
      deltaX.value + startOffset,
      -rightWidth.value,
      leftWidth.value,
    );
  }
};

const onTouchEnd = () => {
  if (state.dragging) {
    state.dragging = false;
    toggle(state.offset > 0 ? 'left' : 'right');

    // compatible with desktop scenario
    setTimeout(() => {
      lockClick = false;
    }, 0);
  }
};

const onClick = (position: SwipeCellPosition = 'outside') => {
  if (isInBeforeClosing) return;

  emit('click', position);

  if (opened && !lockClick) {
    if (props.beforeClose) {
      isInBeforeClosing = true;
      const result = props.beforeClose({
        name: props.name,
        position,
      });

      if (result && typeof (result as Promise<boolean>).then === 'function') {
        (result as Promise<boolean>)
          .then((allow) => {
            isInBeforeClosing = false;
            if (allow !== false) close(position);
          })
          .catch(() => {
            isInBeforeClosing = false;
          });
      } else {
        isInBeforeClosing = false;
        if (result !== false) close(position);
      }
    } else {
      close(position);
    }
  }
};

const getClickHandler = (position: SwipeCellPosition) => () => {
  if (lockClick) return;
  onClick(position);
};

const wrapperStyle = computed(() => ({
  transform: `translate3d(${state.offset}px, 0, 0)`,
  transitionDuration: state.dragging ? '0s' : '.6s',
}));

defineExpose({ open, close });
</script>

<template>
  <view
    :class="bem()"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @tap="getClickHandler('cell')()"
  >
    <view :class="bem('wrapper')" :style="wrapperStyle">
      <view
        v-if="leftWidth"
        :class="bem('left')"
        @tap.stop="getClickHandler('left')()"
      >
        <slot name="left" />
      </view>
      <slot />
      <view
        v-if="rightWidth"
        :class="bem('right')"
        @tap.stop="getClickHandler('right')()"
      >
        <slot name="right" />
      </view>
    </view>
  </view>
</template>
