<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface CollapseItemProps {
  name: string | number;
  title?: string;
  value?: string | number;
  label?: string;
  disabled?: boolean;
  isLink?: boolean;
}

const props = withDefaults(defineProps<CollapseItemProps>(), {
  disabled: false,
  isLink: true,
});

const collapse = inject<{
  modelValue: Ref<(string | number)[] | string | number>;
  accordion: Ref<boolean>;
  toggleItem: (name: string | number) => void;
}>('collapse')!;

const isExpanded = computed(() => {
  const modelValue = collapse.modelValue.value;
  if (collapse.accordion.value) {
    return modelValue === props.name;
  }
  return Array.isArray(modelValue) && modelValue.includes(props.name);
});

const headerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  padding: 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: isExpanded.value ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
  opacity: props.disabled ? 0.5 : 1,
}));

const titleStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: '#323233',
  lineHeight: 24,
}));

const valueStyle = computed(() => ({
  fontSize: 14,
  color: '#969799',
  lineHeight: 24,
}));

const labelStyle = computed(() => ({
  fontSize: 12,
  color: '#969799',
  marginTop: 4,
}));

const arrowStyle = computed(() => ({
  fontSize: 16,
  color: '#969799',
  marginLeft: 4,
}));

const contentStyle = computed(() => ({
  display: isExpanded.value ? 'flex' : 'none',
  padding: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

function onTap() {
  if (props.disabled) return;
  collapse.toggleItem(props.name);
}
</script>

<template>
  <!-- Header -->
  <view :style="headerStyle" @tap="onTap">
    <view :style="{ flex: 1 }">
      <slot name="title">
        <text :style="titleStyle">{{ title }}</text>
      </slot>
      <slot name="label">
        <text v-if="label" :style="labelStyle">{{ label }}</text>
      </slot>
    </view>

    <slot name="value">
      <text v-if="value !== undefined" :style="valueStyle">{{ value }}</text>
    </slot>

    <text v-if="isLink" :style="arrowStyle">{{ isExpanded ? '\u2303' : '\u2304' }}</text>
  </view>

  <!-- Content -->
  <view :style="contentStyle">
    <slot />
  </view>
</template>
