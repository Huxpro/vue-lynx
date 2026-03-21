<!--
  Vant Feature Parity Report (Sidebar):
  - Props: 1/1 supported (modelValue)
    - modelValue: number (default 0) - index of active item (v-model)
  - Events: 2/2 supported (update:modelValue, change)
  - Slots: 1/1 supported (default - SidebarItem children)
  - Sub-components: SidebarItem (separate file)
  - Lynx Adaptations:
    - Uses provide/inject for parent-child communication
    - Vant uses useChildren/useParent for auto-indexing; here index is passed as prop
    - role="tablist" not applicable in Lynx
  - Gaps:
    - SidebarItem index must be manually passed (no auto-indexing from useChildren)
    - No role/tabindex/aria attributes (Lynx limitation)
-->
<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface SidebarProps {
  modelValue?: number;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  modelValue: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

function setActive(index: number) {
  if (index !== props.modelValue) {
    emit('update:modelValue', index);
    emit('change', index);
  }
}

provide('sidebar', {
  modelValue: toRef(props, 'modelValue'),
  setActive,
});

const sidebarStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  width: 80,
  backgroundColor: '#f7f8fa',
  overflow: 'hidden',
}));
</script>

<template>
  <view :style="sidebarStyle">
    <slot />
  </view>
</template>
