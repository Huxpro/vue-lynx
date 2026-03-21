<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue-lynx';

export interface BarrageItem {
  id?: number | string;
  text: string;
}

export interface BarrageProps {
  modelValue?: BarrageItem[];
  autoPlay?: boolean;
  rows?: number;
  top?: number;
  duration?: number;
  delay?: number;
}

const props = withDefaults(defineProps<BarrageProps>(), {
  modelValue: () => [],
  autoPlay: true,
  rows: 4,
  top: 10,
  duration: 4000,
  delay: 300,
});

const emit = defineEmits<{
  'update:modelValue': [value: BarrageItem[]];
}>();

interface ActiveBarrageItem {
  id: number;
  text: string;
  row: number;
  startTime: number;
}

const activeItems = ref<ActiveBarrageItem[]>([]);
const idCounter = ref(0);
const containerWidth = ref(320);
const playing = ref(props.autoPlay);
let intervalId: ReturnType<typeof setInterval> | null = null;
const pendingQueue = ref<string[]>([]);

const now = ref(Date.now());
let rafId: number | null = null;

function tick() {
  now.value = Date.now();
  activeItems.value = activeItems.value.filter((item) => {
    const elapsed = now.value - item.startTime;
    return elapsed < props.duration + 1000;
  });
  rafId = requestAnimationFrame(tick);
}

function getItemLeft(item: ActiveBarrageItem): number {
  const elapsed = now.value - item.startTime;
  const progress = Math.min(elapsed / props.duration, 1);
  return containerWidth.value * (1 - progress) - progress * 200;
}

function addBarrage(text: string) {
  const row = idCounter.value % props.rows;
  const item: ActiveBarrageItem = {
    id: ++idCounter.value,
    text,
    row,
    startTime: Date.now(),
  };
  activeItems.value = [...activeItems.value, item];
}

function play() {
  playing.value = true;
  if (!intervalId) {
    intervalId = setInterval(processQueue, props.delay);
  }
}

function pause() {
  playing.value = false;
}

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    const oldLen = oldVal ? oldVal.length : 0;
    const added = newVal.slice(oldLen);
    added.forEach((item) => pendingQueue.value.push(item.text));
  },
  { deep: true },
);

function processQueue() {
  if (!playing.value) return;
  const item = pendingQueue.value.shift();
  if (item) {
    addBarrage(item);
  }
}

onMounted(() => {
  rafId = requestAnimationFrame(tick);

  // Initialize from existing model value
  if (props.modelValue.length > 0) {
    props.modelValue.forEach((item) => pendingQueue.value.push(item.text));
  }

  if (props.autoPlay) {
    intervalId = setInterval(processQueue, props.delay);
  }
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (intervalId) clearInterval(intervalId);
});

defineExpose({ play, pause });

const rowHeight = computed(() => 32);
const containerHeight = computed(() => props.rows * rowHeight.value);
</script>

<template>
  <view :style="{
    position: 'relative',
    width: '100%',
    height: containerHeight,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginTop: top,
  }">
    <slot />
    <view
      v-for="item in activeItems"
      :key="item.id"
      :style="{
        position: 'absolute',
        top: item.row * rowHeight,
        left: getItemLeft(item),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
      }"
    >
      <text :style="{ fontSize: 14, color: '#fff', whiteSpace: 'nowrap' }">{{ item.text }}</text>
    </view>
  </view>
</template>
