<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface IndexAnchorProps {
  index: string | number;
}

const props = defineProps<IndexAnchorProps>();

const indexBar = inject<{
  activeAnchor: Ref<string | number>;
  highlightColor: Ref<string>;
  stickyOffsetTop: Ref<number>;
}>('indexBar');

const isActive = computed(() => {
  return indexBar?.activeAnchor.value === props.index;
});

const anchorStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 32,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: isActive.value ? '#f2f3f5' : 'transparent',
}));

const textStyle = computed(() => ({
  fontSize: 14,
  fontWeight: 'bold' as const,
  color: isActive.value ? (indexBar?.highlightColor.value || '#1989fa') : '#323233',
}));
</script>

<template>
  <view :style="anchorStyle">
    <text :style="textStyle">{{ index }}</text>
  </view>
  <slot />
</template>
