<!--
  Lynx Limitations:
  - teleport: no-op (Lynx has no Teleport/portal support)
  - sticky: accepted for API compat but sticky anchor positioning not supported (no getBoundingClientRect scroll tracking)
  - scroll-spy: no auto-detection of active anchor from scroll position (no IntersectionObserver/scroll event on parent)
  - touch-move gesture: sidebar supports tap only, not drag-across-indices (no document.elementFromPoint)
  - stickyOffsetTop: accepted for API compat but has no effect without sticky anchor support
  - position: fixed sidebar replaced with absolute positioning within flex container
-->
<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue-lynx';
import { INDEX_BAR_KEY, type Numeric } from './types';

export interface IndexBarProps {
  indexList?: Numeric[];
  sticky?: boolean;
  zIndex?: Numeric;
  teleport?: string | object;
  highlightColor?: string;
  stickyOffsetTop?: number;
}

const props = withDefaults(defineProps<IndexBarProps>(), {
  indexList: () => {
    const charCodeOfA = 'A'.charCodeAt(0);
    return Array(26)
      .fill('')
      .map((_, i) => String.fromCharCode(charCodeOfA + i));
  },
  sticky: true,
  stickyOffsetTop: 0,
});

const emit = defineEmits<{
  select: [index: Numeric];
  change: [index: Numeric];
}>();

const activeAnchor = ref<Numeric>('');

watch(activeAnchor, (value) => {
  if (value) {
    emit('change', value);
  }
});

function scrollTo(index: Numeric) {
  activeAnchor.value = index;
  emit('select', index);
}

provide(INDEX_BAR_KEY, {
  props,
  activeAnchor,
});

defineExpose({ scrollTo });

function addUnit(value: Numeric | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

const containerStyle = computed(() => ({
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'row' as const,
  flex: 1,
}));

const contentStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
}));

const sidebarStyle = computed(() => {
  const zIndex = props.zIndex !== undefined ? +props.zIndex + 1 : 2;
  return {
    position: 'absolute' as const,
    right: '0px',
    top: '0px',
    bottom: '0px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '20px',
    zIndex,
  };
});

const indexItemBaseStyle = {
  fontSize: '10px',
  lineHeight: '14px',
  textAlign: 'center' as const,
  fontWeight: 'bold' as const,
  width: '20px',
  height: '14px',
  paddingLeft: '16px',
  paddingRight: '4px',
};
</script>

<template>
  <view :style="containerStyle">
    <view :style="contentStyle">
      <slot />
    </view>
    <view :style="sidebarStyle">
      <text
        v-for="index in indexList"
        :key="String(index)"
        :style="{
          ...indexItemBaseStyle,
          color: activeAnchor === index ? (highlightColor || '#1989fa') : '#323233',
          fontWeight: activeAnchor === index ? 'bold' : 'normal',
        }"
        @tap="scrollTo(index)"
      >{{ index }}</text>
    </view>
  </view>
</template>
