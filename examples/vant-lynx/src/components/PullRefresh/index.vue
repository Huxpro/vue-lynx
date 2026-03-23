<!--
  Lynx Limitations:
  - scroll parent detection: Lynx uses <scroll-view> instead of overflow:scroll, so useScrollParent
    is not applicable. The component assumes it is always at scroll top for pull detection.
  - passive event listeners: Lynx touch event model doesn't support addEventListener options
  - teleport: Lynx has no Teleport support
-->
<script setup lang="ts">
import { ref, reactive, watch, nextTick, useSlots, computed } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { useTouch } from '../../composables/useTouch';
import Loading from '../Loading/index.vue';
import type { PullRefreshStatus } from './types';
import './index.less';

const DEFAULT_HEAD_HEIGHT = 50;
const TEXT_STATUS: PullRefreshStatus[] = ['pulling', 'loosing', 'success'];

export interface PullRefreshProps {
  modelValue?: boolean;
  disabled?: boolean;
  headHeight?: number | string;
  successText?: string;
  pullingText?: string;
  loosingText?: string;
  loadingText?: string;
  pullDistance?: number | string;
  successDuration?: number | string;
  animationDuration?: number | string;
}

const [, bem] = createNamespace('pull-refresh');

const props = withDefaults(defineProps<PullRefreshProps>(), {
  modelValue: false,
  disabled: false,
  headHeight: DEFAULT_HEAD_HEIGHT,
  successText: undefined,
  pullingText: 'Pull to refresh...',
  loosingText: 'Release to refresh...',
  loadingText: 'Loading...',
  pullDistance: undefined,
  successDuration: 500,
  animationDuration: 300,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  refresh: [];
  change: [params: { status: PullRefreshStatus; distance: number }];
}>();

const slots = useSlots();
const touch = useTouch();

const state = reactive({
  status: 'normal' as PullRefreshStatus,
  distance: 0,
  duration: 0,
});

const headStyle = computed(() => {
  if (+props.headHeight !== DEFAULT_HEAD_HEIGHT) {
    return { height: `${props.headHeight}px` };
  }
  return undefined;
});

const trackStyle = computed(() => {
  return {
    transitionDuration: `${state.duration}ms`,
    transform: state.distance
      ? `translate3d(0,${state.distance}px, 0)`
      : '',
  };
});

const isTouchable = () =>
  state.status !== 'loading' &&
  state.status !== 'success' &&
  !props.disabled;

const ease = (distance: number) => {
  const pullDistance = +(props.pullDistance || props.headHeight);

  if (distance > pullDistance) {
    if (distance < pullDistance * 2) {
      distance = pullDistance + (distance - pullDistance) / 2;
    } else {
      distance = pullDistance * 1.5 + (distance - pullDistance * 2) / 4;
    }
  }

  return Math.round(distance);
};

const setStatus = (distance: number, isLoading?: boolean) => {
  const pullDistance = +(props.pullDistance || props.headHeight);
  state.distance = distance;

  if (isLoading) {
    state.status = 'loading';
  } else if (distance === 0) {
    state.status = 'normal';
  } else if (distance < pullDistance) {
    state.status = 'pulling';
  } else {
    state.status = 'loosing';
  }

  emit('change', {
    status: state.status,
    distance,
  });
};

const getStatusText = () => {
  const { status } = state;
  if (status === 'normal') return '';
  const textMap: Record<string, string | undefined> = {
    pulling: props.pullingText,
    loosing: props.loosingText,
    loading: props.loadingText,
    success: props.successText,
  };
  return textMap[status] || '';
};

const showSuccessTip = () => {
  state.status = 'success';
  setTimeout(() => {
    setStatus(0);
  }, +props.successDuration);
};

const onTouchStart = (event: TouchEvent) => {
  if (isTouchable()) {
    state.duration = 0;
    touch.start(event);
  }
};

const onTouchMove = (event: TouchEvent) => {
  if (isTouchable()) {
    touch.move(event);

    if (touch.deltaY.value >= 0 && touch.isVertical()) {
      setStatus(ease(touch.deltaY.value));
    }
  }
};

const onTouchEnd = () => {
  if (touch.deltaY.value && isTouchable()) {
    state.duration = +props.animationDuration;

    if (state.status === 'loosing') {
      setStatus(+props.headHeight, true);
      emit('update:modelValue', true);
      nextTick(() => emit('refresh'));
    } else {
      setStatus(0);
    }
  }
};

watch(
  () => props.modelValue,
  (value) => {
    state.duration = +props.animationDuration;

    if (value) {
      setStatus(+props.headHeight, true);
    } else if (slots.success || props.successText) {
      showSuccessTip();
    } else {
      setStatus(0, false);
    }
  },
);
</script>

<template>
  <view :class="bem()">
    <view
      :class="bem('track')"
      :style="trackStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view :class="bem('head')" :style="headStyle">
        <slot v-if="slots[state.status]" :name="state.status" :distance="state.distance" />
        <template v-else>
          <view v-if="TEXT_STATUS.includes(state.status)" :class="bem('text')">
            <text>{{ getStatusText() }}</text>
          </view>
          <Loading v-if="state.status === 'loading'" :class="bem('loading')">
            {{ getStatusText() }}
          </Loading>
        </template>
      </view>
      <slot />
    </view>
  </view>
</template>
