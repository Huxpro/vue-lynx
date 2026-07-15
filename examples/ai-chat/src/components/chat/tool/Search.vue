<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import { getDomain, getFaviconUrl } from '../../../lib/url';
import type { ToolUIPart } from '../../../types/ai';
import { isToolStreaming } from '../../../types/ai';
import Icon from '../../ui/Icon.vue';

/**
 * Port of the UChatTool web-search rendering + tool/Sources.vue: collapsible
 * "Searched the web" row with the query suffix and a source list with
 * favicons.
 */
const props = defineProps<{
  invocation: ToolUIPart;
}>();

interface Source {
  url: string;
  title?: string;
}

const streaming = computed(() => isToolStreaming(props.invocation));

const query = computed(() => String(props.invocation.input?.query ?? ''));

const sources = computed(() => {
  const output = props.invocation.output as { sources?: Source[] } | undefined;
  return output?.sources ?? [];
});

const open = ref(false);
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
        {{ streaming ? 'Searching the web...' : 'Searched the web' }}
      </text>
      <text v-if="query" class="text-sm text-dimmed" text-maxline="1">{{ query }}</text>
    </view>

    <view
      v-if="open && sources.length"
      class="rounded-md border border-default p-1 flex flex-col"
    >
      <view
        v-for="source in sources"
        :key="source.url"
        class="flex flex-row items-center gap-2 px-2 py-1 rounded-md"
      >
        <image :src="getFaviconUrl(source.url)" class="favicon rounded-sm" />
        <text class="text-sm text-muted flex-1" text-maxline="1">
          {{ source.title || getDomain(source.url) }}
        </text>
        <text v-if="source.title" class="text-xs text-dimmed">{{ getDomain(source.url) }}</text>
      </view>
    </view>
  </view>
</template>

<style>
.favicon {
  width: 16px;
  height: 16px;
}
</style>
