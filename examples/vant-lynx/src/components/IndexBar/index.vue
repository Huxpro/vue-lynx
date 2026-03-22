<!--
  Lynx Limitations:
  - teleport: no-op (Lynx has no Teleport/portal support)
  - sticky: accepted for API compat but sticky anchor positioning not supported (no getBoundingClientRect scroll tracking)
  - scroll-spy: no auto-detection of active anchor from scroll position (no IntersectionObserver/scroll event on parent)
  - touch-move gesture: sidebar supports tap only, not drag-across-indices (no document.elementFromPoint)
  - stickyOffsetTop: accepted for API compat but has no effect without sticky anchor support
-->
<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { INDEX_BAR_KEY, type Numeric } from './types';
import './index.less';

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

const [, bem] = createNamespace('index-bar');

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

const sidebarStyle = computed(() => {
  if (props.zIndex !== undefined) {
    return { zIndex: +props.zIndex + 1 };
  }
  return undefined;
});
</script>

<template>
  <view :class="bem()">
    <view :class="bem('wrapper')">
      <slot />
    </view>
    <view :class="bem('sidebar')" :style="sidebarStyle">
      <text
        v-for="index in indexList"
        :key="String(index)"
        :class="bem('index', { active: activeAnchor === index })"
        :style="activeAnchor === index && highlightColor ? { color: highlightColor } : undefined"
        @tap="scrollTo(index)"
      >{{ index }}</text>
    </view>
  </view>
</template>
