<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface SidebarItemProps {
  title?: string;
  dot?: boolean;
  badge?: string | number;
  disabled?: boolean;
  index?: number;
}

const props = withDefaults(defineProps<SidebarItemProps>(), {
  title: '',
  dot: false,
  disabled: false,
  index: 0,
});

const emit = defineEmits<{
  click: [index: number];
}>();

const sidebar = inject<{
  modelValue: Ref<number>;
  setActive: (index: number) => void;
}>('sidebar')!;

const isActive = computed(() => {
  return sidebar.modelValue.value === props.index;
});

function onTap() {
  if (props.disabled) return;
  sidebar.setActive(props.index);
  emit('click', props.index);
}

const itemStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  position: 'relative' as const,
  padding: 16,
  backgroundColor: isActive.value ? '#fff' : 'transparent',
  opacity: props.disabled ? 0.5 : 1,
}));

const activeBarStyle = computed(() => ({
  position: 'absolute' as const,
  left: 0,
  top: '50%',
  width: 3,
  height: 16,
  marginTop: -8,
  backgroundColor: '#ee0a24',
  borderRadius: 2,
}));

const textStyle = computed(() => ({
  fontSize: 14,
  color: isActive.value ? '#323233' : '#323233',
  fontWeight: isActive.value ? 'bold' : ('normal' as any),
}));

const dotStyle = computed(() => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#ee0a24',
  position: 'absolute' as const,
  top: 8,
  right: 8,
}));

const badgeStyle = computed(() => ({
  fontSize: 10,
  color: '#fff',
  backgroundColor: '#ee0a24',
  borderRadius: 8,
  paddingLeft: 3,
  paddingRight: 3,
  minWidth: 16,
  height: 16,
  lineHeight: 16,
  textAlign: 'center' as const,
  position: 'absolute' as const,
  top: 4,
  right: 4,
}));
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <view v-if="isActive" :style="activeBarStyle" />
    <text :style="textStyle">{{ title }}</text>
    <slot />
    <view v-if="dot" :style="dotStyle" />
    <text v-else-if="badge !== undefined && badge !== ''" :style="badgeStyle">{{ badge }}</text>
  </view>
</template>
