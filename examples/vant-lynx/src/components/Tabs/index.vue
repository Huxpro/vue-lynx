<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue-lynx';

export interface TabsProps {
  modelValue?: string | number;
  type?: 'line' | 'card';
  color?: string;
  background?: string;
  duration?: number;
  animated?: boolean;
  swipeable?: boolean;
  sticky?: boolean;
}

const props = withDefaults(defineProps<TabsProps>(), {
  modelValue: 0,
  type: 'line',
  color: '#1989fa',
  background: '#fff',
  duration: 0.3,
  animated: false,
  swipeable: false,
  sticky: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  click: [value: string | number, title: string];
}>();

const tabs = ref<Array<{ name: string | number; title: string; disabled: boolean }>>([]);

function registerTab(tab: { name: string | number; title: string; disabled: boolean }) {
  const exists = tabs.value.find((t) => t.name === tab.name);
  if (!exists) {
    tabs.value.push(tab);
  }
}

function unregisterTab(name: string | number) {
  const index = tabs.value.findIndex((t) => t.name === name);
  if (index > -1) {
    tabs.value.splice(index, 1);
  }
}

function setActive(name: string | number, title: string) {
  emit('click', name, title);
  if (name !== props.modelValue) {
    emit('update:modelValue', name);
    emit('change', name);
  }
}

provide('tabs', {
  modelValue: toRef(props, 'modelValue'),
  type: toRef(props, 'type'),
  color: toRef(props, 'color'),
  registerTab,
  unregisterTab,
  setActive,
});

const headerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  backgroundColor: props.background,
  borderBottomWidth: props.type === 'line' ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

function tabHeaderStyle(tab: { name: string | number; disabled: boolean }) {
  const isActive = tab.name === props.modelValue;
  const isCard = props.type === 'card';

  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 44,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: isCard && isActive ? props.color : 'transparent',
    borderWidth: isCard ? 0.5 : 0,
    borderStyle: 'solid' as const,
    borderColor: isCard ? props.color : 'transparent',
    opacity: tab.disabled ? 0.5 : 1,
  };
}

function tabTextStyle(tab: { name: string | number; disabled: boolean }) {
  const isActive = tab.name === props.modelValue;
  const isCard = props.type === 'card';

  return {
    fontSize: 14,
    fontWeight: isActive ? ('bold' as const) : ('normal' as const),
    color: isCard
      ? (isActive ? '#fff' : props.color)
      : (isActive ? props.color : '#646566'),
  };
}

function lineStyle(tab: { name: string | number }) {
  const isActive = tab.name === props.modelValue;
  return {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: isActive ? props.color : 'transparent',
    width: 40,
    alignSelf: 'center' as const,
  };
}

function onTabTap(tab: { name: string | number; title: string; disabled: boolean }) {
  if (tab.disabled) return;
  setActive(tab.name, tab.title);
}
</script>

<template>
  <!-- Tab headers -->
  <view :style="headerStyle">
    <view
      v-for="tab in tabs"
      :key="tab.name"
      :style="tabHeaderStyle(tab)"
      @tap="onTabTap(tab)"
    >
      <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="tabTextStyle(tab)">{{ tab.title }}</text>
        <view v-if="type === 'line'" :style="lineStyle(tab)" />
      </view>
    </view>
  </view>

  <!-- Tab content -->
  <view>
    <slot />
  </view>
</template>
