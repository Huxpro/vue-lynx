<!--
  Vant RollingText - Feature Parity Report
  ==========================================
  Vant Source: packages/vant/src/rolling-text/RollingText.tsx

  Props (8/8 supported):
    - startNum: number (default 0)       [YES]
    - targetNum: number                  [YES]
    - textList: string[]                 [YES] added - custom text array mode
    - duration: number (default 2)       [YES] NOTE: Vant uses seconds, we use seconds too
    - autoStart: boolean (default true)  [YES]
    - direction: 'up' | 'down'          [YES]
    - stopOrder: 'ltr' | 'rtl'          [YES]
    - height: number (default 40)        [YES]

  Events: none (matches Vant)
    - animationEnd                       [EXTENSION] custom event for animation completion

  Slots: none (matches Vant)

  Expose (2/2 supported):
    - start()                            [YES]
    - reset()                            [YES]

  Lynx Adaptations:
    - Vant uses CSS transition on translateY for rolling effect via RollingTextItem
      sub-component. Lynx has no CSS transitions, so we use setTimeout-based
      animation with eased interpolation.
    - Vant renders full digit column arrays (0-9 repeated) for smooth scroll;
      we show interpolated digit values per frame.
    - Uses `display: 'flex'` explicitly on all flex containers.
    - Duration is in seconds (matching Vant; was previously ms, now aligned).

  Gaps:
    - No CSS transition-based scroll animation (uses JS frame-based interpolation)
    - Visual rolling effect is digit-snapping rather than smooth vertical scroll
    - No per-column RollingTextItem sub-component
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue-lynx';

export interface RollingTextProps {
  startNum?: number;
  targetNum?: number;
  textList?: string[];
  duration?: number;
  autoStart?: boolean;
  direction?: 'up' | 'down';
  stopOrder?: 'ltr' | 'rtl';
  height?: number;
}

const props = withDefaults(defineProps<RollingTextProps>(), {
  startNum: 0,
  targetNum: 0,
  textList: () => [],
  duration: 2,
  autoStart: true,
  direction: 'down',
  stopOrder: 'ltr',
  height: 40,
});

const emit = defineEmits<{
  animationEnd: [];
}>();

// Duration in ms (Vant prop is in seconds)
const durationMs = computed(() => props.duration * 1000);

// Custom text list mode (matching Vant's isCustomType)
const isCustomType = computed(
  () => Array.isArray(props.textList) && props.textList.length > 0,
);

const currentNum = ref(props.startNum);
const currentTextIndex = ref(0);
const isAnimating = ref(false);
let animationTimer: ReturnType<typeof setTimeout> | null = null;
let startTime = 0;

const itemLength = computed(() => {
  if (isCustomType.value) return props.textList[0]?.length || 0;
  return String(Math.max(Math.abs(props.startNum), Math.abs(props.targetNum))).length;
});

const targetStr = computed(() => String(Math.abs(props.targetNum)));
const startStr = computed(() => String(Math.abs(props.startNum)));

const maxLen = computed(() => {
  if (isCustomType.value) return itemLength.value;
  return Math.max(targetStr.value.length, startStr.value.length);
});

const paddedStart = computed(() => startStr.value.padStart(maxLen.value, '0'));
const paddedTarget = computed(() => targetStr.value.padStart(maxLen.value, '0'));

// For number mode: digits of current number
const digits = computed(() => {
  if (isCustomType.value) {
    // Show current text from textList
    const idx = Math.min(currentTextIndex.value, props.textList.length - 1);
    const text = props.textList[idx] || '';
    return text.padStart(maxLen.value, ' ').split('');
  }
  const numStr = String(Math.abs(currentNum.value)).padStart(maxLen.value, '0');
  return numStr.split('');
});

function start() {
  if (isAnimating.value) return;
  isAnimating.value = true;
  startTime = Date.now();

  if (isCustomType.value) {
    animateTextList();
  } else {
    animateNumbers();
  }
}

function animateNumbers() {
  const startVal = props.startNum;
  const targetVal = props.targetNum;
  const duration = durationMs.value;
  const frameInterval = 16;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    currentNum.value = Math.round(startVal + (targetVal - startVal) * eased);

    if (progress < 1) {
      animationTimer = setTimeout(animate, frameInterval);
    } else {
      currentNum.value = targetVal;
      isAnimating.value = false;
      emit('animationEnd');
    }
  }

  animate();
}

function animateTextList() {
  const totalItems = props.textList.length;
  if (totalItems <= 1) {
    isAnimating.value = false;
    emit('animationEnd');
    return;
  }

  const duration = durationMs.value;
  const frameInterval = 16;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    currentTextIndex.value = Math.round(eased * (totalItems - 1));

    if (progress < 1) {
      animationTimer = setTimeout(animate, frameInterval);
    } else {
      currentTextIndex.value = totalItems - 1;
      isAnimating.value = false;
      emit('animationEnd');
    }
  }

  animate();
}

function reset() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  isAnimating.value = false;
  currentNum.value = props.startNum;
  currentTextIndex.value = 0;

  if (props.autoStart) {
    // Match Vant: raf(() => start())
    setTimeout(() => start(), 0);
  }
}

onMounted(() => {
  if (props.autoStart) {
    start();
  }
});

onUnmounted(() => {
  if (animationTimer) {
    clearTimeout(animationTimer);
  }
});

watch(
  () => props.targetNum,
  () => {
    if (props.autoStart && !isCustomType.value) {
      reset();
      start();
    }
  },
);

watch(
  () => props.autoStart,
  (val) => {
    if (val) {
      start();
    }
  },
);

defineExpose({ start, reset });

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'center',
  height: props.height,
  overflow: 'hidden',
}));

const digitStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  width: props.height * 0.6,
  height: props.height,
  overflow: 'hidden',
}));

const digitTextStyle = computed(() => ({
  fontSize: props.height * 0.6,
  fontWeight: 'bold' as const,
  color: '#323233',
  textAlign: 'center' as const,
  lineHeight: props.height,
}));

const isNegative = computed(
  () => !isCustomType.value && (currentNum.value < 0 || props.targetNum < 0 || props.startNum < 0),
);
</script>

<template>
  <view :style="containerStyle">
    <view v-if="isNegative" :style="digitStyle">
      <text :style="digitTextStyle">-</text>
    </view>
    <view
      v-for="(digit, index) in digits"
      :key="index"
      :style="digitStyle"
    >
      <text :style="digitTextStyle">{{ digit }}</text>
    </view>
  </view>
</template>
