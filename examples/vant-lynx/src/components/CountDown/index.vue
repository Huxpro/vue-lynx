<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue-lynx';

export interface CountDownProps {
  time?: number;
  format?: string;
  autoStart?: boolean;
  millisecond?: boolean;
}

const props = withDefaults(defineProps<CountDownProps>(), {
  time: 0,
  format: 'HH:mm:ss',
  autoStart: true,
  millisecond: false,
});

const emit = defineEmits<{
  finish: [];
  change: [timeData: TimeData];
}>();

interface TimeData {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

const remain = ref(props.time);
const counting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const timeData = computed<TimeData>(() => {
  const total = remain.value;
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);
  const milliseconds = total % 1000;
  return { total, days, hours, minutes, seconds, milliseconds };
});

function padZero(num: number, length: number = 2): string {
  return String(num).padStart(length, '0');
}

const formattedTime = computed(() => {
  const { days, hours, minutes, seconds, milliseconds } = timeData.value;
  let result = props.format;
  result = result.replace('DD', padZero(days));
  result = result.replace('HH', padZero(hours));
  result = result.replace('mm', padZero(minutes));
  result = result.replace('ss', padZero(seconds));
  result = result.replace('SSS', padZero(milliseconds, 3));
  result = result.replace('SS', padZero(Math.floor(milliseconds / 10)));
  return result;
});

const textStyle = computed(() => ({
  fontSize: 14,
  color: '#323233',
  lineHeight: 20,
}));

function tick() {
  const interval = props.millisecond ? 16 : 1000;
  const decrement = props.millisecond ? 16 : 1000;

  timer = setInterval(() => {
    if (!counting.value) return;

    const next = remain.value - decrement;
    if (next <= 0) {
      remain.value = 0;
      counting.value = false;
      clearTimer();
      emit('change', timeData.value);
      emit('finish');
    } else {
      remain.value = next;
      emit('change', timeData.value);
    }
  }, interval);
}

function clearTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function start() {
  if (counting.value) return;
  counting.value = true;
  tick();
}

function pause() {
  counting.value = false;
  clearTimer();
}

function reset() {
  clearTimer();
  counting.value = false;
  remain.value = props.time;
  if (props.autoStart) {
    start();
  }
}

watch(
  () => props.time,
  (newTime) => {
    clearTimer();
    counting.value = false;
    remain.value = newTime;
    if (props.autoStart) {
      start();
    }
  }
);

onMounted(() => {
  if (props.autoStart) {
    start();
  }
});

onUnmounted(() => {
  clearTimer();
});

defineExpose({ start, pause, reset });
</script>

<template>
  <view>
    <slot :time-data="timeData" :formatted="formattedTime">
      <text :style="textStyle">{{ formattedTime }}</text>
    </slot>
  </view>
</template>
