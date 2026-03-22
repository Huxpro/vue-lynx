<!--
  Lynx Limitations:
  - resize: No DOM offsetWidth/offsetHeight; width/height must be provided as props or defaults to 100%
  - isHidden: No DOM visibility check; assumes element is always visible
  - usePageVisibility: No Page Visibility API in Lynx; autoplay does not pause on page hide
  - onPopupReopen: Not implemented; autoplay does not restart on popup reopen
  - onActivated/onDeactivated: keep-alive not used in Lynx context
  - useEventListener passive: touchmove uses standard binding
  - stopPropagation: prop accepted but Lynx touch event model may differ
-->
<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onUnmounted,
  provide,
  nextTick,
  useSlots,
} from 'vue-lynx';
import { useTouch } from '../../composables/useTouch';
import {
  SWIPE_KEY,
  type SwipeState,
  type SwipeToOptions,
  type SwipeItemExpose,
} from './types';
import './index.less';

export interface SwipeProps {
  loop?: boolean;
  width?: number | string;
  height?: number | string;
  vertical?: boolean;
  autoplay?: number | string;
  duration?: number | string;
  touchable?: boolean;
  lazyRender?: boolean;
  initialSwipe?: number | string;
  indicatorColor?: string;
  showIndicators?: boolean;
  stopPropagation?: boolean;
}

const props = withDefaults(defineProps<SwipeProps>(), {
  loop: true,
  vertical: false,
  autoplay: 0,
  duration: 500,
  touchable: true,
  lazyRender: false,
  initialSwipe: 0,
  showIndicators: true,
  stopPropagation: true,
});

const emit = defineEmits<{
  change: [index: number];
  dragStart: [params: { index: number }];
  dragEnd: [params: { index: number }];
}>();

const slots = useSlots();

const state = reactive<SwipeState>({
  rect: null,
  width: 0,
  height: 0,
  offset: 0,
  active: 0,
  swiping: false,
});

let dragging = false;
const touch = useTouch();

// Child management via provide/inject (replaces @vant/use useChildren)
const children = ref<SwipeItemExpose[]>([]);

const registerChild = (child: SwipeItemExpose): number => {
  children.value.push(child);
  return children.value.length - 1;
};

const unregisterChild = (child: SwipeItemExpose) => {
  const idx = children.value.indexOf(child);
  if (idx > -1) {
    children.value.splice(idx, 1);
  }
};

const count = computed(() => children.value.length);

const size = computed(() => {
  if (props.vertical) {
    return state.height || 150;
  }
  return state.width || 300;
});

const delta = computed(() =>
  props.vertical ? touch.deltaY.value : touch.deltaX.value,
);

const minOffset = computed(() => {
  if (state.rect) {
    const base = props.vertical ? state.rect.height : state.rect.width;
    return base - size.value * count.value;
  }
  return 0;
});

const maxCount = computed(() =>
  size.value
    ? Math.ceil(Math.abs(minOffset.value) / size.value)
    : count.value,
);

const trackSize = computed(() => count.value * size.value);

const activeIndicator = computed(
  () => (state.active + count.value) % count.value,
);

const isCorrectDirection = computed(() => {
  const expect = props.vertical ? 'vertical' : 'horizontal';
  return touch.direction.value === expect;
});

const trackStyle = computed(() => {
  const style: Record<string, string> = {
    transitionDuration: `${state.swiping ? 0 : props.duration}ms`,
    transform: `translate${props.vertical ? 'Y' : 'X'}(${+state.offset.toFixed(2)}px)`,
  };

  if (size.value) {
    const mainAxis = props.vertical ? 'height' : 'width';
    const crossAxis = props.vertical ? 'width' : 'height';
    style[mainAxis] = `${trackSize.value}px`;
    if (props[crossAxis]) {
      style[crossAxis] = `${props[crossAxis]}px`;
    }
  }

  return style;
});

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

const getTargetActive = (pace: number) => {
  const { active } = state;
  if (pace) {
    if (props.loop) {
      return clamp(active + pace, -1, count.value);
    }
    return clamp(active + pace, 0, maxCount.value);
  }
  return active;
};

const getTargetOffset = (targetActive: number, offset = 0) => {
  let currentPosition = targetActive * size.value;
  if (!props.loop) {
    currentPosition = Math.min(currentPosition, -minOffset.value);
  }

  let targetOffset = offset - currentPosition;
  if (!props.loop) {
    targetOffset = clamp(targetOffset, minOffset.value, 0);
  }

  return targetOffset;
};

const move = ({
  pace = 0,
  offset = 0,
  emitChange,
}: {
  pace?: number;
  offset?: number;
  emitChange?: boolean;
}) => {
  if (count.value <= 1) {
    return;
  }

  const { active } = state;
  const targetActive = getTargetActive(pace);
  const targetOffset = getTargetOffset(targetActive, offset);

  // auto move first and last swipe in loop mode
  if (props.loop) {
    if (children.value[0] && targetOffset !== minOffset.value) {
      const outRightBound = targetOffset < minOffset.value;
      children.value[0].setOffset(outRightBound ? trackSize.value : 0);
    }

    if (children.value[count.value - 1] && targetOffset !== 0) {
      const outLeftBound = targetOffset > 0;
      children.value[count.value - 1].setOffset(
        outLeftBound ? -trackSize.value : 0,
      );
    }
  }

  state.active = targetActive;
  state.offset = targetOffset;

  if (emitChange && targetActive !== active) {
    emit('change', activeIndicator.value);
  }
};

const correctPosition = () => {
  state.swiping = true;

  if (state.active <= -1) {
    move({ pace: count.value });
  } else if (state.active >= count.value) {
    move({ pace: -count.value });
  }
};

// doubleRaf replacement using setTimeout (requestAnimationFrame not available in Lynx BG thread)
function doubleRaf(fn: () => void) {
  setTimeout(() => {
    setTimeout(fn, 16);
  }, 16);
}

const prev = () => {
  correctPosition();
  touch.reset();

  doubleRaf(() => {
    state.swiping = false;
    move({ pace: -1, emitChange: true });
  });
};

const next = () => {
  correctPosition();
  touch.reset();

  doubleRaf(() => {
    state.swiping = false;
    move({ pace: 1, emitChange: true });
  });
};

let autoplayTimer: ReturnType<typeof setTimeout>;

const stopAutoplay = () => clearTimeout(autoplayTimer);

const startAutoplay = () => {
  stopAutoplay();
  if (+props.autoplay > 0 && count.value > 1) {
    autoplayTimer = setTimeout(() => {
      next();
      startAutoplay();
    }, +props.autoplay);
  }
};

const initialize = (active = +props.initialSwipe) => {
  // Set dimensions from props (no DOM measurement in Lynx)
  const w = +(props.width || 300);
  const h = +(props.height || 150);
  state.rect = { width: w, height: h };
  state.width = w;
  state.height = h;

  if (count.value) {
    active = Math.min(count.value - 1, active);
    if (active === -1) {
      active = count.value - 1;
    }
  }

  state.active = active;
  state.swiping = true;
  state.offset = getTargetOffset(active);
  children.value.forEach((swipe) => {
    swipe.setOffset(0);
  });

  startAutoplay();
};

const resize = () => initialize(state.active);

let touchStartTime: number;

function onTouchStart(event: any) {
  if (!props.touchable || (event.touches && event.touches.length > 1)) return;

  touch.start(event);
  dragging = false;
  touchStartTime = Date.now();

  stopAutoplay();
  correctPosition();
}

function onTouchMove(event: any) {
  if (props.touchable && state.swiping) {
    touch.move(event);

    if (isCorrectDirection.value) {
      const isEdgeTouch =
        !props.loop &&
        ((state.active === 0 && delta.value > 0) ||
          (state.active === count.value - 1 && delta.value < 0));

      if (!isEdgeTouch) {
        if (props.stopPropagation && event.stopPropagation) {
          event.stopPropagation();
        }
        if (event.preventDefault) {
          event.preventDefault();
        }
        move({ offset: delta.value });

        if (!dragging) {
          emit('dragStart', { index: activeIndicator.value });
          dragging = true;
        }
      }
    }
  }
}

function onTouchEnd() {
  if (!props.touchable || !state.swiping) {
    return;
  }

  const duration = Date.now() - touchStartTime;
  const speed = delta.value / duration;
  const shouldSwipe =
    Math.abs(speed) > 0.25 || Math.abs(delta.value) > size.value / 2;

  if (shouldSwipe && isCorrectDirection.value) {
    const offset = props.vertical
      ? touch.offsetY.value
      : touch.offsetX.value;

    let pace = 0;

    if (props.loop) {
      pace = offset > 0 ? (delta.value > 0 ? -1 : 1) : 0;
    } else {
      pace = -Math[delta.value > 0 ? 'ceil' : 'floor'](
        delta.value / size.value,
      );
    }

    move({ pace, emitChange: true });
  } else if (delta.value) {
    move({ pace: 0 });
  }

  dragging = false;
  state.swiping = false;

  emit('dragEnd', { index: activeIndicator.value });
  startAutoplay();
}

const swipeTo = (index: number, options: SwipeToOptions = {}) => {
  correctPosition();
  touch.reset();

  doubleRaf(() => {
    let targetIndex: number;
    if (props.loop && index === count.value) {
      targetIndex = state.active === 0 ? 0 : index;
    } else {
      targetIndex = index % count.value;
    }

    if (options.immediate) {
      doubleRaf(() => {
        state.swiping = false;
      });
    } else {
      state.swiping = false;
    }

    move({ pace: targetIndex - state.active, emitChange: true });
  });
};

provide(SWIPE_KEY, {
  props,
  size,
  count,
  activeIndicator,
  registerChild,
  unregisterChild,
});

watch(
  () => props.initialSwipe,
  (value) => initialize(+value),
);

watch(count, () => initialize(state.active));
watch(() => props.autoplay, startAutoplay);

onMounted(() => {
  // Wait for children to register before initializing
  nextTick(() => {
    initialize();
  });
});

onUnmounted(stopAutoplay);

defineExpose({
  prev,
  next,
  state,
  resize,
  swipeTo,
});

const indicatorDots = computed(() =>
  Array(count.value).fill('').map((_, i) => i),
);
</script>

<template>
  <view class="van-swipe">
    <view
      class="van-swipe__track"
      :class="{ 'van-swipe__track--vertical': vertical }"
      :style="trackStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <slot />
    </view>
    <slot name="indicator" :active="activeIndicator" :total="count">
      <view
        v-if="showIndicators && count > 1"
        class="van-swipe__indicators"
        :class="{ 'van-swipe__indicators--vertical': vertical }"
      >
        <view
          v-for="i in indicatorDots"
          :key="i"
          class="van-swipe__indicator"
          :class="{ 'van-swipe__indicator--active': i === activeIndicator }"
          :style="i === activeIndicator && indicatorColor ? { backgroundColor: indicatorColor } : undefined"
        />
      </view>
    </slot>
  </view>
</template>
