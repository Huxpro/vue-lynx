<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue-lynx';

export interface IndexBarProps {
  indexList?: string[];
  stickyOffsetTop?: number;
  highlightColor?: string;
}

const props = withDefaults(defineProps<IndexBarProps>(), {
  indexList: () => [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ],
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
});

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

const indexItemStyle = computed(() => ({
  fontSize: 10,
  lineHeight: 14,
  textAlign: 'center' as const,
  width: 20,
  height: 14,
}));
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
          ...indexItemStyle,
          color: activeAnchor === index ? highlightColor : '#323233',
          fontWeight: activeAnchor === index ? 'bold' : 'normal',
        }"
        @tap="scrollToAnchor(index)"
      >{{ index }}</text>
    </view>
  </view>
</template>
