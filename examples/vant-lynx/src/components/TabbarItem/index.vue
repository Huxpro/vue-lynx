<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface TabbarItemProps {
  name?: string | number;
  icon?: string;
  dot?: boolean;
  badge?: string | number;
}

const props = withDefaults(defineProps<TabbarItemProps>(), {
  dot: false,
});

const tabbar = inject<{
  modelValue: Ref<number | string>;
  activeColor: Ref<string>;
  inactiveColor: Ref<string>;
  setActive: (value: number | string) => void;
}>('tabbar')!;

const isActive = computed(() => {
  return tabbar.modelValue.value === props.name;
});

const itemColor = computed(() => {
  return isActive.value ? tabbar.activeColor.value : tabbar.inactiveColor.value;
});

const itemStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  height: 50,
}));

const iconStyle = computed(() => ({
  fontSize: 22,
  color: itemColor.value,
  marginBottom: 4,
}));

const textStyle = computed(() => ({
  fontSize: 12,
  color: itemColor.value,
}));

const dotStyle = computed(() => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#ee0a24',
  position: 'absolute' as const,
  top: 0,
  right: -4,
}));

const badgeStyle = computed(() => ({
  fontSize: 10,
  color: '#fff',
  backgroundColor: '#ee0a24',
  borderRadius: 8,
  paddingLeft: 4,
  paddingRight: 4,
  minWidth: 16,
  height: 16,
  lineHeight: 16,
  textAlign: 'center' as const,
  position: 'absolute' as const,
  top: -4,
  right: -8,
}));

function onTap() {
  if (props.name !== undefined) {
    tabbar.setActive(props.name);
  }
}
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <!-- Icon area -->
    <view :style="{ position: 'relative' }">
      <slot name="icon" :active="isActive">
        <text v-if="icon" :style="iconStyle">{{ icon }}</text>
      </slot>
      <view v-if="dot" :style="dotStyle" />
      <text v-else-if="badge !== undefined && badge !== ''" :style="badgeStyle">{{ badge }}</text>
    </view>

    <!-- Text label -->
    <text :style="textStyle">
      <slot />
    </text>
  </view>
</template>
