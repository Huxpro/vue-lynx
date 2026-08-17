<script setup lang="ts">
import { computed } from 'vue-lynx';

import { assetUrl } from '../../lib/api';
import Icon from './Icon.vue';

const props = withDefaults(
  defineProps<{
    src?: string;
    icon?: string;
    size?: number;
    /** rounded-lg instead of full circle (file previews) */
    squared?: boolean;
  }>(),
  { size: 32 },
);

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <view
    class="items-center justify-center bg-elevated overflow-hidden shrink-0"
    :class="squared ? 'rounded-lg' : 'rounded-full'"
    :style="style"
  >
    <image
      v-if="src"
      :src="assetUrl(src)"
      :style="style"
      resize="cover"
    />
    <Icon v-else-if="icon" :name="icon" tone="muted" :size="Math.round(size * 0.5)" />
  </view>
</template>
