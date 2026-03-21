<!--
  Vant Feature Parity Report:
  - Props: 9/9 supported
    - row: number (default 0) - number of paragraph rows
    - rowWidth: Numeric | Numeric[] (default '100%', last row '60%') - width of each row
    - title: boolean (default false) - show title placeholder
    - titleWidth: Numeric (default '40%') - title width
    - avatar: boolean (default false) - show avatar placeholder
    - avatarSize: Numeric (default 32) - avatar size
    - avatarShape: 'round' | 'square' (default 'round') - avatar shape
    - loading: boolean (default true) - show skeleton when true, slot content when false
    - round: boolean (default false) - use larger border-radius on placeholder elements
    - animate: boolean (default true) - enable animation shimmer effect
  - Slots: 2/2 supported (default, template)
    - default: content shown when loading is false
    - template: custom skeleton layout (Vant's named slot)
  - Sub-components: Vant uses SkeletonTitle, SkeletonAvatar, SkeletonParagraph
    - This implementation inlines the sub-component logic
  - Lynx Adaptations:
    - No CSS animation for shimmer (Lynx does not support CSS keyframes)
    - Uses opacity reduction as visual cue for animate prop
    - Uses view elements with inline styles only
  - Gaps:
    - No shimmer/pulse animation (Lynx limitation - no CSS keyframes)
    - Sub-components (SkeletonTitle, SkeletonAvatar, SkeletonParagraph) not
      exposed separately; all logic is inlined
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SkeletonProps {
  row?: number;
  rowWidth?: string | number | (string | number)[];
  round?: boolean;
  title?: boolean;
  titleWidth?: string | number;
  avatar?: boolean;
  avatarSize?: number;
  avatarShape?: 'round' | 'square';
  loading?: boolean;
  animate?: boolean;
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  row: 0,
  round: false,
  title: false,
  titleWidth: '40%',
  avatar: false,
  avatarSize: 32,
  avatarShape: 'round',
  loading: true,
  animate: true,
});

const DEFAULT_ROW_WIDTH = '100%';
const DEFAULT_LAST_ROW_WIDTH = '60%';

const roundRadius = computed(() => (props.round ? 8 : 4));

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  padding: 16,
}));

const avatarStyle = computed(() => ({
  width: props.avatarSize,
  height: props.avatarSize,
  borderRadius: props.avatarShape === 'round' ? props.avatarSize / 2 : roundRadius.value,
  backgroundColor: '#f2f3f5',
  marginRight: 16,
  flexShrink: 0,
  opacity: props.animate ? 0.6 : 1,
}));

const contentStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
}));

const titleStyle = computed(() => ({
  width: typeof props.titleWidth === 'number' ? props.titleWidth : props.titleWidth,
  height: 16,
  backgroundColor: '#f2f3f5',
  borderRadius: roundRadius.value,
  marginBottom: 12,
  opacity: props.animate ? 0.6 : 1,
}));

function getRowWidth(index: number): string | number {
  if (!props.rowWidth) {
    // Last row is 60%, others 100% (matches Vant DEFAULT_LAST_ROW_WIDTH)
    return index === props.row - 1 ? DEFAULT_LAST_ROW_WIDTH : DEFAULT_ROW_WIDTH;
  }
  if (Array.isArray(props.rowWidth)) {
    return props.rowWidth[index] ?? DEFAULT_ROW_WIDTH;
  }
  return props.rowWidth;
}

function getRowStyle(index: number) {
  const width = getRowWidth(index);
  return {
    width: typeof width === 'number' ? width : width,
    height: 16,
    backgroundColor: '#f2f3f5',
    borderRadius: roundRadius.value,
    marginTop: index > 0 ? 12 : 0,
    opacity: props.animate ? 0.6 : 1,
  };
}

const rows = computed(() => {
  const result: number[] = [];
  for (let i = 0; i < props.row; i++) {
    result.push(i);
  }
  return result;
});
</script>

<template>
  <view v-if="loading" :style="containerStyle">
    <!-- Avatar -->
    <view v-if="avatar" :style="avatarStyle" />

    <!-- Content -->
    <view :style="contentStyle">
      <!-- Template slot for custom skeleton layout (Vant parity) -->
      <slot name="template">
        <!-- Title -->
        <view v-if="title" :style="titleStyle" />

        <!-- Rows -->
        <view
          v-for="index in rows"
          :key="index"
          :style="getRowStyle(index)"
        />
      </slot>
    </view>
  </view>

  <!-- Default slot (shown when not loading) -->
  <slot v-else />
</template>
