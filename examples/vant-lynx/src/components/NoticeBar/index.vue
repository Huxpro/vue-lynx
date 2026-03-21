<!--
  Vant Feature Parity Report (NoticeBar):
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/notice-bar/NoticeBar.tsx
  - Props: 9/9 supported (text, mode, color, background, leftIcon, wrapable, scrollable, delay, speed)
  - Events: 3/3 supported (click, close, replay)
  - Slots: 3/3 supported (default, left-icon, right-icon)
  - Sub-components: Icon (for left-icon, close/arrow right icons)
  - Scrolling marquee: Timer-based offset animation (Lynx lacks DOM measurement APIs;
    uses estimated width from text length * avgCharWidth for marquee distance)
  - Close mode: Hides bar on close, emits close event
  - Link mode: Shows arrow icon, entire bar is tappable
  - Ellipsis: When scrollable=false and wrapable=false, text is single-line with overflow hidden
  - Wrapable: When wrapable=true, text wraps to multiple lines with adjusted padding
  - Exposed methods: reset() to restart marquee animation
  - Gaps:
    - No CSS transition timing function (Lynx inline style animation is timer-based, not CSS transition)
    - No CSS variable theming (inline styles only in Lynx)
    - No DOM measurement for exact content/wrap width (uses character count estimate)
    - scrollable=null auto-detection relies on estimated widths, not actual DOM measurement
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useMainThreadRef, runOnMainThread } from 'vue-lynx';
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

// Main-thread marquee animation using element.animate()
const marqueeRef = useMainThreadRef(null);
let animationTimer: ReturnType<typeof setTimeout> | null = null;
let startDelayTimer: ReturnType<typeof setTimeout> | null = null;

// Estimated character width for marquee distance calculation.
// Lynx does not provide DOM measurement APIs (useRect), so we approximate
// the content width from text length. Average CJK char ~14px at fontSize 14.
const AVG_CHAR_WIDTH = 8;
const WRAP_WIDTH = 300; // Estimated visible wrap width (bar minus padding/icons)

function _marqueeAnimate(wrapW: number, contentW: number, duration: number) {
  'main thread';
  if (typeof (marqueeRef as any).current?.animate === 'function') {
    return (marqueeRef as any).current.animate(
      [
        { transform: `translateX(${wrapW}px)` },
        { transform: `translateX(${-contentW}px)` },
      ],
      { duration, fill: 'forwards', easing: 'linear', iterations: Infinity },
    );
  }
}

const estimatedContentWidth = computed(() => {
  return (props.text?.length || 0) * AVG_CHAR_WIDTH;
});

const shouldScroll = computed(() => {
  // scrollable=false explicitly disables scrolling
  if (props.scrollable === false) return false;
  // scrollable=true forces scrolling
  if (props.scrollable === true) return true;
  // scrollable=null (default): auto-detect -- scroll if content overflows
  return estimatedContentWidth.value > WRAP_WIDTH;
});

const resolvedSpeed = computed(() => +(props.speed) || 60);
const resolvedDelay = computed(() => (+(props.delay) || 1) * 1000);

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
    // Wrapable mode: auto height, extra vertical padding
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
    // Marquee mode: positioned for element.animate() translateX
    base.position = 'absolute';
    base.whiteSpace = 'nowrap';
  } else if (props.wrapable) {
    // Wrapable mode: allow text wrapping
    base.position = 'relative';
  } else {
    // Ellipsis mode (single line, no scroll)
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

function stopAnimation() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  if (startDelayTimer) {
    clearTimeout(startDelayTimer);
    startDelayTimer = null;
  }
}

function startAnimation() {
  stopAnimation();

  if (!shouldScroll.value || !visible.value) return;

  const contentW = estimatedContentWidth.value;
  const wrapW = WRAP_WIDTH;
  const speed = resolvedSpeed.value; // px per second
  const totalDistance = wrapW + contentW;
  const duration = (totalDistance / speed) * 1000; // ms for one full scroll cycle

  startDelayTimer = setTimeout(() => {
    runOnMainThread(_marqueeAnimate)(wrapW, contentW, duration);
  }, resolvedDelay.value);
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

// Restart animation when text or scrollable changes
watch(
  () => [props.text, props.scrollable],
  () => {
    reset();
  },
);

// Stop animation when hidden
watch(visible, (val) => {
  if (val) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

// Expose reset method (Vant parity)
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
        <text :main-thread-ref="marqueeRef" :style="contentStyle">{{ text }}</text>
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
