<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';

import Icon from '../ui/Icon.vue';
import MarkdownView from './MarkdownView.vue';

/**
 * Port of UChatReasoning: collapsible "thinking" section, auto-open while
 * streaming, collapses when done.
 */
const props = defineProps<{
  text: string;
  streaming: boolean;
}>();

const open = ref(props.streaming);

const startedAt = ref(Date.now());
const seconds = ref(0);

watch(
  () => props.streaming,
  (streaming) => {
    open.value = streaming;
    if (streaming) startedAt.value = Date.now();
    else seconds.value = Math.max(1, Math.round((Date.now() - startedAt.value) / 1000));
  },
);

// matches UChatReasoning's collapsed label
const label = computed(() =>
  props.streaming
    ? 'Thinking...'
    : seconds.value
      ? `Thought for ${seconds.value} second${seconds.value === 1 ? '' : 's'}`
      : 'Reasoning',
);
</script>

<template>
  <view class="flex flex-col gap-2">
    <view class="flex flex-row items-center gap-1.5" @tap="open = !open">
      <Icon
        name="i-lucide-chevron-down"
        tone="muted"
        :size="16"
        :style="{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }"
      />
      <text class="text-sm text-muted" :class="streaming ? 'shimmer-pulse' : ''">
        {{ label }}
      </text>
    </view>

    <view v-if="open" class="flex flex-row gap-3 pl-1.5">
      <view class="reasoning-bar" />
      <view class="flex-1 reasoning-body">
        <MarkdownView :markdown="text" :streaming="streaming" />
      </view>
    </view>
  </view>
</template>

<style>
.reasoning-bar {
  width: 2px;
  background-color: var(--ui-border-accented);
  border-radius: 1px;
}
.reasoning-body {
  opacity: 0.75;
}
</style>
