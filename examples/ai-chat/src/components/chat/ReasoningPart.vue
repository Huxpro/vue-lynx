<script setup lang="ts">
import { ref, watch } from 'vue-lynx';

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

watch(
  () => props.streaming,
  (streaming) => {
    open.value = streaming;
  },
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
        {{ streaming ? 'Thinking...' : 'Reasoning' }}
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
