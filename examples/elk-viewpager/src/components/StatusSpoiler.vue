<script setup lang="ts">
// Ported from elk: app/components/status/StatusSpoiler.vue — content
// warning fold with show/hide toggle.
import { ref } from 'vue-lynx';

defineProps<{
  spoilerText: string;
}>();

const expanded = ref(false);

defineExpose({ expanded });
</script>

<template>
  <view class="status-spoiler">
    <text class="status-spoiler-text">{{ spoilerText }}</text>
    <view class="status-spoiler-btn" @tap="expanded = !expanded">
      <text class="status-spoiler-btn-text">{{ expanded ? 'Hide content' : 'Show content' }}</text>
    </view>
  </view>
  <slot v-if="expanded" />
</template>

<style>
.status-spoiler {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.status-spoiler-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-base);
}

.status-spoiler-btn {
  background-color: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  padding: 3px 10px;
}

.status-spoiler-btn-text {
  font-size: 12px;
  color: var(--c-text-secondary);
}
</style>
