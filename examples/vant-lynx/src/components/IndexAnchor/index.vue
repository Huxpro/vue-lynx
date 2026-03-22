<!--
  Lynx Limitations:
  - sticky positioning: no-op (Lynx lacks position: sticky and scroll-based DOM measurement)
  - BORDER_BOTTOM class: replaced with inline border style
  - getBoundingClientRect/useRect: not available for scroll tracking
  - position: fixed anchor: not supported (no scroll-spy to trigger sticky state)
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';
import { INDEX_BAR_KEY, type Numeric } from '../IndexBar/types';

export interface IndexAnchorProps {
  index?: Numeric;
}

const props = defineProps<IndexAnchorProps>();

const indexBar = inject<{
  props: {
    sticky: boolean;
    zIndex: Numeric | undefined;
    highlightColor: string | undefined;
    stickyOffsetTop: number;
    indexList: Numeric[];
  };
  activeAnchor: Ref<Numeric>;
}>(INDEX_BAR_KEY);

const isActive = computed(() => {
  return indexBar?.activeAnchor.value === props.index;
});

const anchorStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: '32px',
  paddingLeft: '16px',
  paddingRight: '16px',
  backgroundColor: isActive.value ? '#f2f3f5' : 'transparent',
}));

const textStyle = computed(() => ({
  fontSize: '14px',
  fontWeight: 'bold' as const,
  lineHeight: '32px',
  color: isActive.value ? (indexBar?.props.highlightColor || '#1989fa') : '#323233',
}));
</script>

<template>
  <view :style="anchorStyle">
    <slot>
      <text :style="textStyle">{{ index }}</text>
    </slot>
  </view>
</template>
