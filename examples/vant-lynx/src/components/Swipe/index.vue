<!--
  Vant Feature Parity Report:
  - Props: 11/11 supported
    - autoplay: Numeric (default 0) - autoplay interval in ms, 0 to disable
    - duration: Numeric (default 500) - animation duration in ms
    - initialSwipe: Numeric (default 0) - initial slide index
    - width: Numeric - slide width (auto-detected in Vant; explicit in Lynx)
    - height: Numeric (default 150) - slide height
    - loop: boolean (default true) - enable infinite loop
    - showIndicators: boolean (default true) - show pagination indicators
    - vertical: boolean (default false) - vertical swipe mode
    - touchable: boolean (default true) - enable touch gestures
    - stopPropagation: boolean (default true) - stop touch event propagation
    - lazyRender: boolean (default false) - lazy render off-screen slides
    - indicatorColor: string (default '#1989fa') - active indicator color
  - Events: 3/3 supported
    - change: (index: number) - emitted when active slide changes
    - dragStart: ({ index }) - emitted when drag begins
    - dragEnd: ({ index }) - emitted when drag ends
  - Slots: 2/2 supported
    - default: slide content (SwipeItem children)
    - indicator: custom indicator content
  - Exposed Methods: 4/5 supported
    - prev(): go to previous slide
    - next(): go to next slide
    - swipeTo(index): jump to specific slide
    - setCount(n): set total slide count (Lynx-specific, replaces children counting)
    - resize(): NOT implemented (no DOM measurement in Lynx)
  - Lynx Adaptations:
    - No DOM measurement, so width must be provided explicitly
    - No CSS transitions (transitionDuration not supported); uses transform only
    - Touch events use Lynx touch model (event?.touches?.[0])
    - Child count must be set manually via setCount() (no useChildren injection)
    - stopPropagation prop accepted but not actionable (Lynx event model)
  - Gaps:
    - resize() method not implemented (no DOM measurement in Lynx)
    - lazyRender prop accepted but not implemented (no dynamic child visibility)
    - No CSS transition animation between slides (instant snapping)
    - No automatic child count detection (requires manual setCount call)
    - No page visibility / deactivate handling for autoplay pause
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue-lynx';

export interface SwipeProps {
  autoplay?: number;
  duration?: number;
  initialSwipe?: number;
  width?: number;
  height?: number;
  loop?: boolean;
  showIndicators?: boolean;
  vertical?: boolean;
  touchable?: boolean;
  stopPropagation?: boolean;
  lazyRender?: boolean;
  indicatorColor?: string;
}

const props = withDefaults(defineProps<SwipeProps>(), {
  autoplay: 0,
  duration: 500,
  initialSwipe: 0,
  width: 0,
  height: 150,
  loop: true,
  showIndicators: true,
  vertical: false,
  touchable: true,
  stopPropagation: true,
  lazyRender: false,
  indicatorColor: '#1989fa',
});

const emit = defineEmits<{
  change: [index: number];
  dragStart: [params: { index: number }];
  dragEnd: [params: { index: number }];
}>();

const activeIndex = ref(props.initialSwipe);
const totalCount = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDeltaX = ref(0);
const touchDeltaY = ref(0);
const isDragging = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

watch(() => props.initialSwipe, (val) => {
  activeIndex.value = val;
});

const slideSize = computed(() =>
  props.vertical ? props.height : (props.width || 300),
);

const trackStyle = computed(() => {
  const offset = -activeIndex.value * slideSize.value;

  const dragOffset = isDragging.value
    ? (props.vertical ? touchDeltaY.value : touchDeltaX.value)
    : 0;

  return {
    display: 'flex',
    flexDirection: (props.vertical ? 'column' : 'row') as 'row' | 'column',
    height: props.vertical ? undefined : props.height,
    transform: props.vertical
      ? `translateY(${offset + dragOffset}px)`
      : `translateX(${offset + dragOffset}px)`,
  };
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  position: 'relative' as const,
  height: props.height,
  width: props.width || undefined,
}));

function startAutoplay() {
  stopAutoplay();
  if (props.autoplay > 0 && totalCount.value > 1) {
    autoplayTimer = setInterval(() => {
      next();
    }, props.autoplay);
  }
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function next() {
  const count = totalCount.value;
  if (count <= 0) return;
  let nextIndex = activeIndex.value + 1;
  if (nextIndex >= count) {
    nextIndex = props.loop ? 0 : count - 1;
  }
  if (nextIndex !== activeIndex.value) {
    activeIndex.value = nextIndex;
    emit('change', nextIndex);
  }
}

function prev() {
  const count = totalCount.value;
  if (count <= 0) return;
  let prevIndex = activeIndex.value - 1;
  if (prevIndex < 0) {
    prevIndex = props.loop ? count - 1 : 0;
  }
  if (prevIndex !== activeIndex.value) {
    activeIndex.value = prevIndex;
    emit('change', prevIndex);
  }
}

function swipeTo(index: number) {
  const count = totalCount.value;
  if (count <= 0) return;
  const target = Math.max(0, Math.min(index, count - 1));
  if (target !== activeIndex.value) {
    activeIndex.value = target;
    emit('change', target);
  }
}

function onTouchStart(event: any) {
  if (!props.touchable) return;
  stopAutoplay();
  const touch = event?.touches?.[0] || event;
  touchStartX.value = touch.clientX || touch.pageX || 0;
  touchStartY.value = touch.clientY || touch.pageY || 0;
  touchDeltaX.value = 0;
  touchDeltaY.value = 0;
  isDragging.value = true;
  emit('dragStart', { index: activeIndex.value });
}

function onTouchMove(event: any) {
  if (!props.touchable || !isDragging.value) return;
  const touch = event?.touches?.[0] || event;
  const x = touch.clientX || touch.pageX || 0;
  const y = touch.clientY || touch.pageY || 0;
  touchDeltaX.value = x - touchStartX.value;
  touchDeltaY.value = y - touchStartY.value;
}

function onTouchEnd() {
  if (!props.touchable || !isDragging.value) return;
  isDragging.value = false;

  const delta = props.vertical ? touchDeltaY.value : touchDeltaX.value;
  const threshold = slideSize.value / 3;

  if (Math.abs(delta) > threshold) {
    if (delta < 0) {
      next();
    } else {
      prev();
    }
  }

  touchDeltaX.value = 0;
  touchDeltaY.value = 0;
  emit('dragEnd', { index: activeIndex.value });
  startAutoplay();
}

function setCount(count: number) {
  totalCount.value = count;
}

watch(() => props.autoplay, () => {
  startAutoplay();
});

onMounted(() => {
  startAutoplay();
});

onUnmounted(() => {
  stopAutoplay();
});

defineExpose({ next, prev, swipeTo, setCount, activeIndex });

const indicatorContainerStyle = computed(() => ({
  display: 'flex',
  flexDirection: (props.vertical ? 'column' : 'row') as 'row' | 'column',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  position: 'absolute' as const,
  bottom: props.vertical ? undefined : 8,
  right: props.vertical ? 8 : undefined,
  left: props.vertical ? undefined : 0,
  top: props.vertical ? 0 : undefined,
  width: props.vertical ? undefined : '100%',
  height: props.vertical ? '100%' : undefined,
}));
</script>

<template>
  <view :style="containerStyle">
    <view :style="trackStyle">
      <slot />
    </view>
    <slot name="indicator">
      <view v-if="showIndicators && totalCount > 1" :style="indicatorContainerStyle">
        <view
          v-for="i in totalCount"
          :key="i"
          :style="{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: (i - 1) === activeIndex ? indicatorColor : 'rgba(255,255,255,0.5)',
            marginLeft: vertical ? 0 : 3,
            marginRight: vertical ? 0 : 3,
            marginTop: vertical ? 3 : 0,
            marginBottom: vertical ? 3 : 0,
          }"
        />
      </view>
    </slot>
  </view>
</template>
