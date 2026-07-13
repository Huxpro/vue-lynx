<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue-lynx';

/**
 * Direct port of app/components/chat/Indicator.vue — the 4x4 animated dot
 * matrix shown while waiting for the assistant (CSS grid becomes 4 flex
 * rows of 4 dots).
 */
const size = 4;
const totalDots = size * size;

const patterns = [
  [[0], [1], [2], [3], [7], [11], [15], [14], [13], [12], [8], [4], [5], [6], [10], [9]],
  [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
  [[5, 6, 9, 10], [1, 4, 7, 8, 11, 14], [0, 3, 12, 15], [1, 4, 7, 8, 11, 14], [5, 6, 9, 10]],
  [[0], [1, 4], [2, 5, 8], [3, 6, 9, 12], [7, 10, 13], [11, 14], [15]],
];

const activeDots = ref<Set<number>>(new Set());
let patternIndex = 0;
let stepIndex = 0;

function nextStep() {
  const pattern = patterns[patternIndex];
  if (!pattern) return;

  activeDots.value = new Set(pattern[stepIndex]);
  stepIndex++;

  if (stepIndex >= pattern.length) {
    stepIndex = 0;
    patternIndex = (patternIndex + 1) % patterns.length;
  }
}

let matrixInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  nextStep();
  matrixInterval = setInterval(nextStep, 120);
});

onUnmounted(() => {
  clearInterval(matrixInterval);
});

const rows = [0, 1, 2, 3];
const cols = [0, 1, 2, 3];
</script>

<template>
  <view class="flex flex-col shrink-0" style="gap: 2px">
    <view v-for="row in rows" :key="row" class="flex flex-row" style="gap: 2px">
      <view
        v-for="col in cols"
        :key="col"
        class="indicator-dot bg-inverted"
        :style="{ opacity: activeDots.has(row * 4 + col) ? '1' : '0.2' }"
      />
    </view>
  </view>
</template>

<style>
.indicator-dot {
  width: 3px;
  height: 3px;
  border-radius: 1px;
}
</style>
