<!--
  Vant Feature Parity Report:
  - Component: Barrage
  - Props: Reviewed - see implementation for details
  - Events: Reviewed - see implementation for details
  - Slots: Reviewed - see implementation for details
  - Status: Reviewed in V2 optimization pass
-->
<!--
  Vant Barrage - Feature Parity Report
  =====================================
  Vant Source: packages/vant/src/barrage/Barrage.tsx

  Props (6/6 supported):
    - modelValue: BarrageItem[]        [YES]
    - autoPlay: boolean (default true) [YES]
    - rows: number (default 4)         [YES]
    - top: number (default 10)         [YES]
    - duration: number (default 4000)  [YES]
    - delay: number (default 300)      [YES]

  Events (1/1 supported):
    - update:modelValue                [YES]

  Slots (1/1 supported):
    - default                          [YES]

  Expose (2/2 supported):
    - play()                           [YES]
    - pause()                          [YES]

  Lynx Adaptations:
    - Vant uses DOM createElement + CSS @keyframes animation; Lynx has no CSS
      keyframes, so we use requestAnimationFrame-driven position updates.
    - Vant removes items via `animationend` event on DOM spans; we use elapsed
      time filtering in rAF tick.
    - Vant calculates row height from offsetHeight; we use a fixed 32px row
      height since Lynx lacks offsetHeight.
    - Uses `display: 'flex'` explicitly on barrage item wrappers.

  Gaps:
    - No CSS animation (Lynx limitation) -- uses JS-based position tracking
    - No real DOM measurement -- fixed row height (32px)
    - Items removed from modelValue differ from Vant (Vant emits update:modelValue
      on animationend to remove items; we do time-based cleanup)
-->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue-lynx';

export interface BarrageItem {
  id?: number | string;
  text: string | number;
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
  originalId?: number | string;
}

const activeItems = ref<ActiveBarrageItem[]>([]);
const idCounter = ref(0);
const containerWidth = ref(320);
const playing = ref(props.autoPlay);
let intervalId: ReturnType<typeof setInterval> | null = null;
const pendingQueue = ref<{ text: string; id?: number | string }[]>([]);

const now = ref(Date.now());
let rafId: number | null = null;

function tick() {
  now.value = Date.now();
  const expiredItems: ActiveBarrageItem[] = [];
  activeItems.value = activeItems.value.filter((item) => {
    const elapsed = now.value - item.startTime;
    if (elapsed >= props.duration + 1000) {
      expiredItems.push(item);
      return false;
    }
    return true;
  });

  // Emit update:modelValue to remove expired items (matching Vant behavior)
  if (expiredItems.length > 0 && props.modelValue.length > 0) {
    const expiredIds = new Set(
      expiredItems.map((item) => String(item.originalId)),
    );
    const updated = props.modelValue.filter(
      (item) => !expiredIds.has(String(item.id)),
    );
    if (updated.length !== props.modelValue.length) {
      emit('update:modelValue', updated);
    }
  }

  rafId = requestAnimationFrame(tick);
}

function getItemLeft(item: ActiveBarrageItem): number {
  const elapsed = now.value - item.startTime;
  const progress = Math.min(elapsed / props.duration, 1);
  return containerWidth.value * (1 - progress) - progress * 200;
}

function addBarrage(text: string, originalId?: number | string) {
  const row = idCounter.value % props.rows;
  const item: ActiveBarrageItem = {
    id: ++idCounter.value,
    text,
    row,
    startTime: Date.now(),
    originalId,
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
    added.forEach((item) =>
      pendingQueue.value.push({ text: String(item.text), id: item.id }),
    );
  },
  { deep: true },
);

function processQueue() {
  if (!playing.value) return;
  const item = pendingQueue.value.shift();
  if (item) {
    addBarrage(item.text, item.id);
  }
}

onMounted(() => {
  rafId = requestAnimationFrame(tick);

  // Initialize from existing model value
  if (props.modelValue.length > 0) {
    props.modelValue.forEach((item) =>
      pendingQueue.value.push({ text: String(item.text), id: item.id }),
    );
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
    display: 'flex',
    flexDirection: 'column',
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
