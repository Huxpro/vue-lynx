<!--
  Lynx Limitations:
  - pinch-zoom: Two-finger gestures may not work in all Lynx hosts; falls back to double-tap zoom
  - naturalWidth/naturalHeight: Image load event may not expose natural dimensions in Lynx
  - safari matrix workaround: Not needed in Lynx, but kept for parity
  - useEventListener passive: touchmove uses standard binding
-->
<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { useTouch } from '../../composables/useTouch';
import Image from '../Image/index.vue';
import Loading from '../Loading/index.vue';
import SwipeItem from '../SwipeItem/index.vue';

const [, bem] = createNamespace('image-preview');

const LONG_PRESS_START_TIME = 500;

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

const props = withDefaults(
  defineProps<{
    src?: string;
    show?: boolean;
    active?: number;
    minZoom: number | string;
    maxZoom: number | string;
    rootWidth: number;
    rootHeight: number;
    disableZoom?: boolean;
    doubleScale?: boolean;
    closeOnClickImage?: boolean;
    closeOnClickOverlay?: boolean;
    vertical?: boolean;
  }>(),
  {
    doubleScale: true,
    closeOnClickImage: true,
    closeOnClickOverlay: true,
  },
);

const emit = defineEmits<{
  scale: [params: { scale: number; index: number }];
  close: [];
  longPress: [];
}>();

const state = reactive({
  scale: 1,
  moveX: 0,
  moveY: 0,
  moving: false,
  zooming: false,
  initializing: false,
  imageRatio: 0,
});

const touch = useTouch();
const swipeItemRef = ref();
const isVertical = ref(false);
const isLongImage = ref(false);

let initialMoveY = 0;
let fingerNum = 0;
let startMoveX = 0;
let startMoveY = 0;
let startScale = 1;
let startDistance = 0;
let doubleTapTimer: ReturnType<typeof setTimeout> | null = null;
let touchStartTime = 0;
let lastCenter: { x: number; y: number } | undefined;

const longImageRatio = 2.6;

const maxMoveX = computed(() => {
  if (state.imageRatio) {
    const displayWidth = props.vertical
      ? props.rootHeight / state.imageRatio
      : props.rootWidth;
    return Math.max(0, (state.scale * displayWidth - props.rootWidth) / 2);
  }
  return 0;
});

const maxMoveY = computed(() => {
  if (state.imageRatio) {
    const displayHeight = props.vertical
      ? props.rootHeight
      : props.rootWidth * state.imageRatio;
    return Math.max(0, (state.scale * displayHeight - props.rootHeight) / 2);
  }
  return 0;
});

const imageStyle = computed(() => {
  const { scale, moveX, moveY, moving, zooming, initializing } = state;
  const style: Record<string, any> = {
    transitionDuration: zooming || moving || initializing ? '0s' : '0.3s',
  };

  if (scale !== 1 || isLongImage.value) {
    style.transform = `matrix(${scale}, 0, 0, ${scale}, ${moveX}, ${moveY})`;
  }

  return style;
});

function setScale(scale: number, center?: { x: number; y: number }) {
  scale = clamp(scale, +props.minZoom, +props.maxZoom + 1);

  if (scale !== state.scale) {
    const ratio = scale / state.scale;
    state.scale = scale;

    if (center) {
      const moveX = state.moveX - (center.x - props.rootWidth / 2) * (ratio - 1);
      const moveY =
        state.moveY - (center.y - props.rootHeight / 2) * (ratio - 1);
      state.moveX = clamp(moveX, -maxMoveX.value, maxMoveX.value);
      state.moveY = clamp(moveY, -maxMoveY.value, maxMoveY.value);
    } else {
      state.moveX = clamp(state.moveX, -maxMoveX.value, maxMoveX.value);
      state.moveY = clamp(state.moveY, -maxMoveY.value, maxMoveY.value);
    }

    emit('scale', {
      scale,
      index: props.active ?? 0,
    });
  }
}

function resetScale() {
  setScale(1);
  state.moveX = 0;
  state.moveY = isLongImage.value ? initialMoveY : 0;
}

function toggleScale() {
  const scale = state.scale > 1 ? 1 : 2;

  setScale(scale, lastCenter || { x: props.rootWidth / 2, y: props.rootHeight / 2 });

  emit('scale', {
    scale,
    index: props.active ?? 0,
  });
}

function getDistance(touches: TouchList) {
  return Math.sqrt(
    (touches[0].clientX - touches[1].clientX) ** 2 +
      (touches[0].clientY - touches[1].clientY) ** 2,
  );
}

function getCenter(touches: TouchList) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

let isImageMoved = false;

function onTouchStart(event: TouchEvent) {
  const { touches } = event;
  fingerNum = touches.length;

  if (fingerNum === 2 && props.disableZoom) {
    return;
  }

  touch.start(event);

  startMoveX = state.moveX;
  startMoveY = state.moveY;
  touchStartTime = Date.now();
  isImageMoved = false;

  state.moving =
    fingerNum === 1 && (state.scale !== 1 || isLongImage.value);
  state.zooming = fingerNum === 2 && !touch.offsetX.value;

  if (state.zooming) {
    startScale = state.scale;
    startDistance = getDistance(touches);
  }
}

function onTouchMove(event: TouchEvent) {
  const { touches } = event;

  touch.move(event);

  if (state.moving) {
    const moveX = touch.deltaX.value + startMoveX;
    const moveY = touch.deltaY.value + startMoveY;

    if (
      (props.vertical
        ? touch.isVertical() && Math.abs(moveY) > maxMoveY.value
        : touch.isHorizontal() && Math.abs(moveX) > maxMoveX.value) &&
      !isImageMoved
    ) {
      state.moving = false;
      return;
    }

    isImageMoved = true;
    state.moveX = clamp(moveX, -maxMoveX.value, maxMoveX.value);
    state.moveY = clamp(moveY, -maxMoveY.value, maxMoveY.value);
  }

  if (state.zooming && touches.length === 2) {
    const distance = getDistance(touches);
    const scale = (startScale * distance) / startDistance;
    lastCenter = getCenter(touches);
    setScale(scale, lastCenter);
  }
}

function checkClose() {
  if (!props.closeOnClickImage) return;
  emit('close');
}

function checkTap(event: TouchEvent) {
  if (fingerNum > 1) return;

  const deltaTime = Date.now() - touchStartTime;
  const TAP_TIME = 250;

  if (touch.isTap.value) {
    if (deltaTime < TAP_TIME) {
      if (props.doubleScale) {
        if (doubleTapTimer) {
          clearTimeout(doubleTapTimer);
          doubleTapTimer = null;
          toggleScale();
        } else {
          doubleTapTimer = setTimeout(() => {
            checkClose();
            doubleTapTimer = null;
          }, TAP_TIME);
        }
      } else {
        checkClose();
      }
    } else if (deltaTime > LONG_PRESS_START_TIME) {
      emit('longPress');
    }
  }
}

function onTouchEnd(event: TouchEvent) {
  if (state.moving || state.zooming) {
    if (
      state.moving &&
      startMoveX === state.moveX &&
      startMoveY === state.moveY
    ) {
      // no actual movement
    }

    if (!event.touches.length) {
      if (state.zooming) {
        state.moveX = clamp(state.moveX, -maxMoveX.value, maxMoveX.value);
        state.moveY = clamp(state.moveY, -maxMoveY.value, maxMoveY.value);
        state.zooming = false;
      }

      state.moving = false;
      startMoveX = 0;
      startMoveY = 0;
      startScale = 1;

      if (state.scale < 1) {
        resetScale();
      }

      const maxZoomVal = +props.maxZoom;
      if (state.scale > maxZoomVal) {
        setScale(maxZoomVal, lastCenter);
      }
    }
  }

  checkTap(event);
  touch.reset();
}

function resize() {
  const { rootWidth, rootHeight } = props;
  if (!rootWidth || !rootHeight || !state.imageRatio) return;

  const rootRatio = rootHeight / rootWidth;

  isVertical.value =
    state.imageRatio > rootRatio && state.imageRatio < longImageRatio;
  isLongImage.value =
    state.imageRatio > rootRatio && state.imageRatio >= longImageRatio;

  if (isLongImage.value) {
    initialMoveY = (state.imageRatio * rootWidth - rootHeight) / 2;
    state.moveY = initialMoveY;
    state.initializing = true;
    requestAnimationFrame(() => {
      state.initializing = false;
    });
  }

  resetScale();
}

function onLoad(event: any) {
  // Try to get natural dimensions from image load event
  const target = event?.target || event?.detail;
  if (target) {
    const naturalWidth = target.naturalWidth || target.width || 0;
    const naturalHeight = target.naturalHeight || target.height || 0;
    if (naturalWidth && naturalHeight) {
      state.imageRatio = naturalHeight / naturalWidth;
      resize();
    }
  }
}

watch(() => props.active, resetScale);
watch(
  () => props.show,
  (value) => {
    if (!value) {
      resetScale();
    }
  },
);
watch(() => [props.rootWidth, props.rootHeight], resize);

defineExpose({ resetScale });
</script>

<template>
  <SwipeItem>
    <view
      ref="swipeItemRef"
      :class="bem('swipe-item')"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <slot
        v-if="$slots.image"
        name="image"
        :src="src"
        :onLoad="onLoad"
        :style="imageStyle"
      />
      <Image
        v-else
        :src="src"
        fit="contain"
        :class="bem('image', { vertical: isVertical })"
        :style="imageStyle"
        @load="onLoad"
      >
        <template #loading>
          <Loading type="spinner" />
        </template>
      </Image>
    </view>
  </SwipeItem>
</template>
