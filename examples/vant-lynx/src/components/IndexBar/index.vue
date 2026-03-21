<!--
  Vant Feature Parity Report (IndexBar):
  - Props: 4/5 supported (indexList, stickyOffsetTop, highlightColor, sticky)
    - indexList: string[] (default A-Z) - list of index anchors
    - stickyOffsetTop: number (default 0) - offset for sticky positioning
    - highlightColor: string (default '#1989fa') - active index color
    - sticky: boolean (default true) - enable sticky anchor headers
    - Missing: zIndex (accepted but not wired to sidebar), teleport (no portal in Lynx)
  - Events: 2/2 supported (select, change)
    - select: fired when an index is tapped
    - change: fired when active anchor changes
  - Slots: 1/1 supported (default - IndexAnchor children)
  - Sub-components: IndexAnchor (separate file)
  - Lynx Adaptations:
    - Sidebar rendered as absolute-positioned column of tappable text items
    - No touch-move/swipe gesture on sidebar (Vant supports dragging across indices)
    - No scroll-spy (Vant auto-detects active anchor from scroll position)
    - Active anchor must be set programmatically or via tap
  - Gaps:
    - No touch-move gesture on sidebar index list
    - No scroll-spy to auto-detect active anchor from scroll position
    - No teleport support
    - zIndex prop not applied
-->
<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue-lynx';

export interface IndexBarProps {
  indexList?: string[];
  sticky?: boolean;
  stickyOffsetTop?: number;
  highlightColor?: string;
  zIndex?: number;
}

const props = withDefaults(defineProps<IndexBarProps>(), {
  indexList: () => [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ],
  sticky: true,
  stickyOffsetTop: 0,
  highlightColor: '#1989fa',
});

const emit = defineEmits<{
  select: [index: string | number];
  change: [index: string | number];
}>();

const activeAnchor = ref<string | number>('');

function setActiveAnchor(index: string | number) {
  if (activeAnchor.value !== index) {
    activeAnchor.value = index;
    emit('change', index);
  }
}

function scrollToAnchor(index: string | number) {
  activeAnchor.value = index;
  emit('select', index);
  emit('change', index);
}

provide('indexBar', {
  activeAnchor,
  highlightColor: toRef(props, 'highlightColor'),
  stickyOffsetTop: toRef(props, 'stickyOffsetTop'),
  sticky: toRef(props, 'sticky'),
});

defineExpose({ setActiveAnchor, scrollToAnchor });

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

const sidebarStyle = computed(() => ({
  position: 'absolute' as const,
  right: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  width: 20,
  zIndex: 2,
}));

const indexItemBaseStyle = {
  fontSize: 10,
  lineHeight: 14,
  textAlign: 'center' as const,
  width: 20,
  height: 14,
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
        :key="index"
        :style="{
          ...indexItemBaseStyle,
          color: activeAnchor === index ? highlightColor : '#323233',
          fontWeight: activeAnchor === index ? 'bold' : 'normal',
        }"
        @tap="scrollToAnchor(index)"
      >{{ index }}</text>
    </view>
  </view>
</template>
