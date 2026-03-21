<!--
  Vant Feature Parity Report (IndexAnchor):
  - Props: 1/1 supported (index)
    - index: string|number (required) - anchor identifier matching IndexBar indexList
  - Events: none
  - Slots: 1/1 supported (default - custom anchor content, falls back to index text)
  - Lynx Adaptations:
    - No sticky positioning (Lynx does not support position: sticky)
    - Active state shown via background color and highlight color from IndexBar
    - No getRect/getBoundingClientRect (Lynx limitation)
  - Gaps:
    - No sticky header behavior (Vant pins active anchor at top while scrolling)
    - No dynamic width/left measurement for sticky positioning
    - No scroll-spy integration (cannot report rect to parent)
-->
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
  sticky: Ref<boolean>;
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
    <slot>
      <text :style="textStyle">{{ index }}</text>
    </slot>
  </view>
  <slot name="content" />
</template>
