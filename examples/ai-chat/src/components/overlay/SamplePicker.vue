<script setup lang="ts">
import { onMounted, ref } from 'vue-lynx';

import { apiFetch, assetUrl } from '../../lib/api';

/**
 * Sample-image picker standing in for the OS file dialog (PRD F8.2 —
 * Lynx has no <input type=file>). Images are bundled with the example
 * server.
 */
const emit = defineEmits<{
  close: [result: { name: string; url: string; mediaType: string } | false];
}>();

interface Sample {
  name: string;
  url: string;
  mediaType: string;
}

const samples = ref<Sample[]>([]);

onMounted(async () => {
  try {
    samples.value = await apiFetch<Sample[]>('/api/samples');
  } catch {
    samples.value = [];
  }
});
</script>

<template>
  <view class="absolute inset-0 z-40 items-center justify-center flex">
    <view class="absolute inset-0 z-40 sheet-backdrop" @tap="emit('close', false)" />
    <view
      class="rounded-lg bg-default border border-default shadow-lg flex flex-col z-50 overflow-hidden p-4 gap-3"
      style="width: 420px; max-width: 90%"
    >
      <view class="flex flex-col gap-1">
        <text class="text-lg font-semibold text-highlighted">Attach a sample image</text>
        <text class="text-sm text-muted">
          Lynx has no file picker — choose one of the bundled demo images instead.
        </text>
      </view>

      <view class="flex flex-row gap-2.5">
        <view
          v-for="sample in samples"
          :key="sample.name"
          class="flex flex-col items-center gap-1.5 flex-1"
          @tap="emit('close', sample)"
        >
          <image :src="assetUrl(sample.url)" class="sample-thumb rounded-lg" resize="cover" />
          <text class="text-xs text-muted">{{ sample.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.sample-thumb {
  width: 116px;
  height: 87px;
}
</style>
