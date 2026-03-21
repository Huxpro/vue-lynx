<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, type Ref } from 'vue-lynx';

export interface TabProps {
  title?: string;
  disabled?: boolean;
  dot?: boolean;
  badge?: string | number;
  name?: string | number;
}

const props = withDefaults(defineProps<TabProps>(), {
  title: '',
  disabled: false,
  dot: false,
});

const tabsContext = inject<{
  modelValue: Ref<string | number>;
  type: Ref<string>;
  color: Ref<string>;
  registerTab: (tab: { name: string | number; title: string; disabled: boolean }) => void;
  unregisterTab: (name: string | number) => void;
  setActive: (name: string | number, title: string) => void;
}>('tabs')!;

const tabName = computed(() => {
  return props.name !== undefined ? props.name : 0;
});

const isActive = computed(() => {
  return tabsContext.modelValue.value === tabName.value;
});

onMounted(() => {
  tabsContext.registerTab({
    name: tabName.value,
    title: props.title,
    disabled: props.disabled,
  });
});

onUnmounted(() => {
  tabsContext.unregisterTab(tabName.value);
});

const contentStyle = computed(() => ({
  display: isActive.value ? 'flex' : 'none',
}));
</script>

<template>
  <view :style="contentStyle">
    <slot />
  </view>
</template>
