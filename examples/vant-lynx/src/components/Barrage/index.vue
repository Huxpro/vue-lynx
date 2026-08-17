<!--
  Lynx Limitations:
  - document.createElement: Vant creates DOM elements imperatively; uses Vue reactive rendering instead
  - offsetHeight: Cannot measure element height; uses fixed row height (26px based on font-size + space)
  - offsetWidth: Cannot measure container width; uses fixed animation endpoint (-500px in @keyframes)
  - --move-distance CSS var: Lynx strips CSS custom properties from inline styles; uses fixed @keyframes endpoint
  - animationend event: Uses setTimeout for item removal instead of animationend event listener
  - text-shadow: May not render in all Lynx hosts
  - user-select: Not applicable in Lynx touch environment
  - CSS inheritance: font-size/color on parent view may not inherit to child text element
-->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue-lynx';
import { createNamespace } from '../../utils';
import type { BarrageItem, BarrageExpose } from './types';
import './index.less';

const props = withDefaults(defineProps<{
  modelValue?: BarrageItem[];
  autoPlay?: boolean;
  rows?: number | string;
  top?: number | string;
  duration?: number | string;
  delay?: number;
}>(), {
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

const [, bem] = createNamespace('barrage');

// Fixed item height: font-size(16px) * line-height(1) + padding-bottom(10px) = 26px
// Matches Vant's item.offsetHeight measurement
const ITEM_HEIGHT = 26;

interface InternalItem {
  key: string;
  originalId: string | number;
  text: string | number;
  top: number;
  delay: number;
}

const activeItems = ref<InternalItem[]>([]);
let totalCount = 0;
let isInitBarrage = true;
const isPlay = ref(false);

interface TimerEntry {
  timer: ReturnType<typeof setTimeout>;
  startedAt: number;
  remainingTime: number;
  key: string;
  originalId: string | number;
}

const timerMap = new Map<string, TimerEntry>();

function removeItem(key: string, originalId: string | number) {
  activeItems.value = activeItems.value.filter(i => i.key !== key);
  timerMap.delete(key);
  emit(
    'update:modelValue',
    [...props.modelValue].filter(v => String(v.id) !== String(originalId)),
  );
}

function scheduleRemoval(key: string, originalId: string | number, totalTime: number) {
  if (!isPlay.value) {
    // When paused, store entry but don't start timer
    timerMap.set(key, {
      timer: 0 as unknown as ReturnType<typeof setTimeout>,
      startedAt: Date.now(),
      remainingTime: totalTime,
      key,
      originalId,
    });
    return;
  }

  const timer = setTimeout(() => {
    removeItem(key, originalId);
  }, totalTime);

  timerMap.set(key, {
    timer,
    startedAt: Date.now(),
    remainingTime: totalTime,
    key,
    originalId,
  });
}

function appendItem(item: BarrageItem, index: number) {
  const delay = isInitBarrage ? index * Number(props.delay) : Number(props.delay);
  totalCount++;
  const row = (totalCount - 1) % Number(props.rows);
  const top = row * ITEM_HEIGHT + Number(props.top);
  const key = `barrage-${totalCount}`;

  activeItems.value = [...activeItems.value, {
    key,
    originalId: item.id,
    text: item.text,
    top,
    delay,
  }];

  scheduleRemoval(key, item.id, Number(props.duration) + delay);
}

function updateBarrages(newValue: BarrageItem[], oldValue: BarrageItem[]) {
  const map = new Map(oldValue.map(item => [item.id, item]));

  newValue.forEach((item, i) => {
    if (map.has(item.id)) {
      map.delete(item.id);
    } else {
      appendItem(item, i);
    }
  });

  map.forEach(item => {
    activeItems.value = activeItems.value.filter(
      i => String(i.originalId) !== String(item.id),
    );
    const entry = [...timerMap.entries()].find(
      ([, e]) => String(e.originalId) === String(item.id),
    );
    if (entry) {
      clearTimeout(entry[1].timer);
      timerMap.delete(entry[0]);
    }
  });

  isInitBarrage = false;
}

watch(
  () => props.modelValue.slice(),
  (newValue, oldValue) => updateBarrages(newValue ?? [], oldValue ?? []),
  { deep: true },
);

onMounted(async () => {
  isPlay.value = props.autoPlay;
  await nextTick();
  updateBarrages(props.modelValue, []);
});

onUnmounted(() => {
  timerMap.forEach(entry => clearTimeout(entry.timer));
  timerMap.clear();
});

function play() {
  isPlay.value = true;
  const now = Date.now();
  timerMap.forEach((entry) => {
    const elapsed = now - entry.startedAt;
    const remaining = Math.max(0, entry.remainingTime - elapsed);
    entry.startedAt = now;
    entry.remainingTime = remaining;
    entry.timer = setTimeout(() => {
      removeItem(entry.key, entry.originalId);
    }, remaining);
  });
}

function pause() {
  isPlay.value = false;
  const now = Date.now();
  timerMap.forEach((entry) => {
    clearTimeout(entry.timer);
    const elapsed = now - entry.startedAt;
    entry.remainingTime = Math.max(0, entry.remainingTime - elapsed);
    entry.startedAt = now;
  });
}

defineExpose<BarrageExpose>({ play, pause });

function getItemStyle(item: InternalItem) {
  return {
    top: `${item.top}px`,
    animationDuration: `${Number(props.duration)}ms`,
    animationDelay: `${item.delay}ms`,
    animationPlayState: isPlay.value ? 'running' : 'paused',
  };
}
</script>

<template>
  <view :class="bem()">
    <slot />
    <view
      v-for="item in activeItems"
      :key="item.key"
      :class="bem('item')"
      :style="getItemStyle(item)"
    >
      <text :style="{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }">{{ String(item.text) }}</text>
    </view>
  </view>
</template>
