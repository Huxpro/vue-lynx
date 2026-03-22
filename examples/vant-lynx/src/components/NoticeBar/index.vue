<!--
  Lynx Limitations:
  - getBoundingClientRect: Lynx lacks DOM measurement APIs; marquee uses character-count estimation for content width
  - CSS transition marquee: Uses timer-based (setInterval) animation instead of CSS transition + transitionend event
  - onPopupReopen: No popup reopen composable in Lynx
  - pageshow event: No pageshow/visibilitychange event listener in Lynx
  - onActivated: No keep-alive activation hook in Lynx
  - v-show: Uses v-if for show/hide since Lynx v-show support is limited
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { NoticeBarMode } from './types';
import './index.less';

interface NoticeBarProps {
  text?: string;
  mode?: NoticeBarMode | '';
  color?: string;
  delay?: number | string;
  speed?: number | string;
  leftIcon?: string;
  wrapable?: boolean;
  background?: string;
  scrollable?: boolean | null;
}

const props = withDefaults(defineProps<NoticeBarProps>(), {
  delay: 1,
  speed: 60,
  wrapable: false,
  scrollable: null,
});

const emit = defineEmits<{
  close: [event: any];
  replay: [];
}>();

// --- State ---
const show = ref(true);
const offset = ref(0);

// Marquee timers
let animationTimer: ReturnType<typeof setInterval> | null = null;
let startTimer: ReturnType<typeof setTimeout> | null = null;

// Lynx lacks DOM measurement; estimate content width from text length
const AVG_CHAR_WIDTH = 8;
const WRAP_WIDTH = 300;

const estimatedContentWidth = computed(
  () => (props.text?.length || 0) * AVG_CHAR_WIDTH,
);

const shouldScroll = computed(() => {
  if (props.scrollable === false) return false;
  if (props.scrollable === true) return true;
  // null = auto: scroll only if content overflows
  return estimatedContentWidth.value > WRAP_WIDTH;
});

const ellipsis = computed(
  () => props.scrollable === false && !props.wrapable,
);

// --- Default colors (from CSS vars --van-notice-bar-text-color / --van-notice-bar-background) ---
const DEFAULT_TEXT_COLOR = '#ed6a0c';
const DEFAULT_BACKGROUND = '#fffbe8';

const resolvedColor = computed(() => props.color || DEFAULT_TEXT_COLOR);
const resolvedBackground = computed(
  () => props.background || DEFAULT_BACKGROUND,
);

// --- Styles ---
const barStyle = computed(() => {
  const s: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    color: resolvedColor.value,
    backgroundColor: resolvedBackground.value,
    fontSize: '14px',
    lineHeight: '24px',
  };

  if (props.wrapable) {
    s.paddingTop = '8px';
    s.paddingBottom = '8px';
    s.paddingLeft = '16px';
    s.paddingRight = '16px';
  } else {
    s.height = '40px';
    s.paddingLeft = '16px';
    s.paddingRight = '16px';
  }

  return s;
});

const leftIconStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  minWidth: '24px',
  fontSize: '16px',
  marginRight: '4px',
}));

const wrapStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  flex: 1,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  height: props.wrapable ? undefined : '100%',
}));

const contentStyle = computed(() => {
  const s: Record<string, any> = {
    color: resolvedColor.value,
    fontSize: '14px',
    lineHeight: '24px',
  };

  if (shouldScroll.value) {
    s.position = 'absolute';
    s.whiteSpace = 'nowrap';
    s.left = `${offset.value}px`;
  } else if (props.wrapable) {
    s.position = 'relative';
  } else {
    // Ellipsis mode
    s.position = 'relative';
    s.overflow = 'hidden';
    s.whiteSpace = 'nowrap';
    s.textOverflow = 'ellipsis';
    s.maxWidth = '100%';
  }

  return s;
});

const rightIconStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  minWidth: '24px',
  fontSize: '16px',
  textAlign: 'right' as const,
  cursor: 'pointer',
}));

// --- Right icon name (derived from mode) ---
const rightIconName = computed(() => {
  if (props.mode === 'closeable') return 'cross';
  if (props.mode === 'link') return 'arrow';
  return '';
});

// --- Marquee Animation ---
function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  if (startTimer) {
    clearTimeout(startTimer);
    startTimer = null;
  }
}

function startAnimation() {
  stopAnimation();

  if (!shouldScroll.value || !show.value) return;

  const cw = estimatedContentWidth.value;
  const ww = WRAP_WIDTH;
  const speed = +(props.speed) || 60;
  const delay = (+(props.delay) ?? 1) * 1000;
  const FRAME_MS = 16;
  const pxPerFrame = speed * (FRAME_MS / 1000);

  // Match Vant: first scroll starts from 0, scrolls to -contentWidth
  offset.value = 0;

  startTimer = setTimeout(() => {
    animationTimer = setInterval(() => {
      offset.value -= pxPerFrame;

      if (offset.value <= -cw) {
        // Content fully scrolled past: jump to right edge (like Vant's onTransitionEnd)
        offset.value = ww;
        emit('replay');
      }
    }, FRAME_MS);
  }, delay);
}

function reset() {
  offset.value = 0;
  startAnimation();
}

// --- Event Handlers ---
function onClickRightIcon(event: any) {
  if (props.mode === 'closeable') {
    show.value = false;
    emit('close', event);
  }
}

// --- Lifecycle ---
onMounted(() => {
  startAnimation();
});

onUnmounted(() => {
  stopAnimation();
});

watch(() => [props.text, props.scrollable], () => {
  reset();
});

watch(show, (val) => {
  if (val) startAnimation();
  else stopAnimation();
});

defineExpose({ reset });
</script>

<template>
  <view v-if="show" :style="barStyle">
    <!-- Left icon -->
    <view v-if="leftIcon || $slots['left-icon']" :style="leftIconStyle">
      <slot name="left-icon">
        <Icon :name="leftIcon" :size="16" :color="resolvedColor" />
      </slot>
    </view>

    <!-- Content wrap (marquee container) -->
    <view :style="wrapStyle">
      <view :style="contentStyle">
        <slot>
          <text>{{ text }}</text>
        </slot>
      </view>
    </view>

    <!-- Right icon -->
    <view
      v-if="rightIconName || $slots['right-icon']"
      :style="rightIconStyle"
      @tap="onClickRightIcon"
    >
      <slot name="right-icon">
        <Icon :name="rightIconName" :size="16" :color="resolvedColor" />
      </slot>
    </view>
  </view>
</template>
