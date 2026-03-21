<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue-lynx';

export interface RollingTextProps {
  startNum?: number;
  targetNum?: number;
  duration?: number;
  autoStart?: boolean;
  direction?: 'up' | 'down';
  stopOrder?: 'ltr' | 'rtl';
  height?: number;
}

const props = withDefaults(defineProps<RollingTextProps>(), {
  startNum: 0,
  targetNum: 0,
  duration: 2000,
  autoStart: true,
  direction: 'down',
  stopOrder: 'ltr',
  height: 40,
});

const emit = defineEmits<{
  animationEnd: [];
}>();

const currentNum = ref(props.startNum);
const isAnimating = ref(false);
let animationTimer: ReturnType<typeof setTimeout> | null = null;
let startTime = 0;

const targetStr = computed(() => String(Math.abs(props.targetNum)));
const startStr = computed(() => String(Math.abs(props.startNum)));

const maxLen = computed(() => Math.max(targetStr.value.length, startStr.value.length));

const paddedStart = computed(() => startStr.value.padStart(maxLen.value, '0'));
const paddedTarget = computed(() => targetStr.value.padStart(maxLen.value, '0'));

const digits = computed(() => {
  const numStr = String(Math.abs(currentNum.value)).padStart(maxLen.value, '0');
  return numStr.split('');
});

// For each digit column, compute the offset for rolling animation
const digitOffsets = computed(() => {
  if (!isAnimating.value) {
    return digits.value.map(() => 0);
  }

  const elapsed = Date.now() - startTime;
  const totalDuration = props.duration;

  return digits.value.map((_, idx) => {
    const digitIndex = props.stopOrder === 'ltr' ? idx : maxLen.value - 1 - idx;
    const digitDelay = (digitIndex / maxLen.value) * totalDuration * 0.3;
    const digitDuration = totalDuration - digitDelay;
    const digitElapsed = Math.max(0, elapsed - digitDelay);
    const progress = Math.min(digitElapsed / digitDuration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    return eased;
  });
});

function getDigitForColumn(colIndex: number): string {
  const startDigit = parseInt(paddedStart.value[colIndex], 10);
  const targetDigit = parseInt(paddedTarget.value[colIndex], 10);

  if (!isAnimating.value) {
    return digits.value[colIndex];
  }

  const progress = digitOffsets.value[colIndex];
  let diff = targetDigit - startDigit;
  if (props.direction === 'up') {
    if (diff > 0) diff = diff - 10;
  } else {
    if (diff < 0) diff = diff + 10;
  }

  const current = startDigit + diff * progress;
  return String(Math.round(current + 10) % 10);
}

function start() {
  if (isAnimating.value) return;
  isAnimating.value = true;
  startTime = Date.now();

  const startVal = props.startNum;
  const targetVal = props.targetNum;
  const duration = props.duration;
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

function reset() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  isAnimating.value = false;
  currentNum.value = props.startNum;
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
    if (props.autoStart) {
      reset();
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
  () => currentNum.value < 0 || props.targetNum < 0 || props.startNum < 0,
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
