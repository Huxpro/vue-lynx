<!--
  Vant Feature Parity Report (NoticeBar):
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/notice-bar/NoticeBar.tsx
  - Props: 9/9 supported (text, mode, color, background, leftIcon, wrapable, scrollable, delay, speed)
  - Events: 3/3 supported (click, close, replay)
  - Slots: 3/3 supported (default, left-icon, right-icon)
  - Sub-components: Icon (for left-icon, close/arrow right icons)
  - Scrolling marquee: CSS transition-based translateX animation with timer-based looping
  - Close mode: Hides bar on close, emits close event
  - Link mode: Shows arrow icon, entire bar is tappable
  - Ellipsis: When scrollable=false and wrapable=false, text is single-line with overflow hidden
  - Wrapable: When wrapable=true, text wraps to multiple lines with adjusted padding
  - Exposed methods: reset() to restart marquee animation
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface NoticeBarProps {
  text?: string;
  mode?: 'closeable' | 'link' | '';
  color?: string;
  background?: string;
  leftIcon?: string;
  wrapable?: boolean;
  scrollable?: boolean | null;
  delay?: number | string;
  speed?: number | string;
}

const props = withDefaults(defineProps<NoticeBarProps>(), {
  text: '',
  mode: '',
  color: '#ed6a0c',
  background: '#fffbe8',
  wrapable: false,
  scrollable: null,
  delay: 1,
  speed: 60,
});

const emit = defineEmits<{
  click: [event: any];
  close: [event: any];
  replay: [];
}>();

const visible = ref(true);

// Estimated character width for marquee distance calculation
const AVG_CHAR_WIDTH = 8;
const WRAP_WIDTH = 300;

const estimatedContentWidth = computed(() => {
  return (props.text?.length || 0) * AVG_CHAR_WIDTH;
});

const shouldScroll = computed(() => {
  if (props.scrollable === false) return false;
  if (props.scrollable === true) return true;
  return estimatedContentWidth.value > WRAP_WIDTH;
});

const resolvedSpeed = computed(() => +(props.speed) || 60);
const resolvedDelay = computed(() => (+(props.delay) || 1) * 1000);

// Marquee state
const marqueeOffset = ref(0);
const marqueeTransitioning = ref(false);
let animationTimer: ReturnType<typeof setTimeout> | null = null;
let startDelayTimer: ReturnType<typeof setTimeout> | null = null;

// --- Styles ---

const barStyle = computed(() => {
  const base: Record<string, any> = {
    display: visible.value ? 'flex' : 'none',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: props.background,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 14,
    lineHeight: 24,
  };

  if (props.wrapable) {
    base.paddingTop = 8;
    base.paddingBottom = 8;
  } else {
    base.height = 40;
    base.minHeight = 40;
  }

  return base;
});

const leftIconStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  marginRight: 4,
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
  const base: Record<string, any> = {
    color: props.color,
    fontSize: 14,
    lineHeight: 24,
  };

  if (shouldScroll.value) {
    base.position = 'absolute';
    base.whiteSpace = 'nowrap';
    base.transform = `translateX(${marqueeOffset.value}px)`;
    base.transition = marqueeTransitioning.value
      ? `transform ${marqueeDuration.value}ms linear`
      : 'none';
  } else if (props.wrapable) {
    base.position = 'relative';
  } else {
    base.position = 'relative';
    base.overflow = 'hidden';
    base.whiteSpace = 'nowrap';
    base.textOverflow = 'ellipsis';
    base.maxWidth = '100%';
  }

  return base;
});

const rightIconStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  marginLeft: 6,
}));

// --- Marquee Animation ---

const marqueeDuration = computed(() => {
  const contentW = estimatedContentWidth.value;
  const totalDistance = WRAP_WIDTH + contentW;
  const speed = resolvedSpeed.value;
  return (totalDistance / speed) * 1000;
});

function stopAnimation() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  if (startDelayTimer) {
    clearTimeout(startDelayTimer);
    startDelayTimer = null;
  }
  marqueeTransitioning.value = false;
}

function startAnimation() {
  stopAnimation();

  if (!shouldScroll.value || !visible.value) return;

  const contentW = estimatedContentWidth.value;

  startDelayTimer = setTimeout(() => {
    runMarqueeCycle(contentW);
  }, resolvedDelay.value);
}

function runMarqueeCycle(contentW: number) {
  // Jump to start position (right edge) without transition
  marqueeTransitioning.value = false;
  marqueeOffset.value = WRAP_WIDTH;

  // Start transition to end position on next frame
  setTimeout(() => {
    marqueeTransitioning.value = true;
    marqueeOffset.value = -contentW;

    // After animation completes, restart
    animationTimer = setTimeout(() => {
      emit('replay');
      runMarqueeCycle(contentW);
    }, marqueeDuration.value);
  }, 16);
}

function reset() {
  startAnimation();
}

// --- Event Handlers ---

function onTap(event: any) {
  emit('click', event);
}

function onClose(event: any) {
  visible.value = false;
  emit('close', event);
}

// --- Lifecycle ---

onMounted(() => {
  startAnimation();
});

onUnmounted(() => {
  stopAnimation();
});

watch(
  () => [props.text, props.scrollable],
  () => {
    reset();
  },
);

watch(visible, (val) => {
  if (val) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

defineExpose({ reset });
</script>

<template>
  <view v-if="visible" :style="barStyle" @tap="onTap">
    <!-- Left icon area -->
    <view v-if="leftIcon || $slots['left-icon']" :style="leftIconStyle">
      <slot name="left-icon">
        <Icon :name="leftIcon" :size="16" :color="color" />
      </slot>
    </view>

    <!-- Scrollable content wrap (marquee container) -->
    <view :style="wrapStyle">
      <slot>
        <text :style="contentStyle">{{ text }}</text>
      </slot>
    </view>

    <!-- Right action area: closeable mode -->
    <view
      v-if="mode === 'closeable'"
      :style="rightIconStyle"
      @tap="onClose"
    >
      <slot name="right-icon">
        <Icon name="cross" :size="16" :color="color" />
      </slot>
    </view>

    <!-- Right action area: link mode -->
    <view v-else-if="mode === 'link'" :style="rightIconStyle">
      <slot name="right-icon">
        <Icon name="arrow" :size="16" :color="color" />
      </slot>
    </view>
  </view>
</template>
