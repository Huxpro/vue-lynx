<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ActionBarIconProps {
  icon?: string;
  text?: string;
  dot?: boolean;
  badge?: string | number;
  color?: string;
  iconClass?: string;
  iconPrefix?: string;
}

const props = withDefaults(defineProps<ActionBarIconProps>(), {
  icon: '',
  text: '',
  dot: false,
  color: '#323233',
});

const emit = defineEmits<{
  click: [event: any];
}>();

function onTap(event: any) {
  emit('click', event);
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minWidth: 48,
  height: 50,
  paddingLeft: 4,
  paddingRight: 4,
}));

const iconStyle = computed(() => ({
  fontSize: 18,
  color: props.color,
  marginBottom: 4,
}));

const textStyle = computed(() => ({
  fontSize: 10,
  color: props.color,
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
  paddingLeft: 3,
  paddingRight: 3,
  minWidth: 16,
  height: 16,
  lineHeight: 16,
  textAlign: 'center' as const,
  position: 'absolute' as const,
  top: -4,
  right: -8,
}));
</script>

<template>
  <view :style="containerStyle" @tap="onTap">
    <view :style="{ position: 'relative' }">
      <text :style="iconStyle">{{ icon }}</text>
      <view v-if="dot" :style="dotStyle" />
      <text v-else-if="badge !== undefined && badge !== ''" :style="badgeStyle">{{ badge }}</text>
    </view>
    <text v-if="text" :style="textStyle">{{ text }}</text>
  </view>
</template>
