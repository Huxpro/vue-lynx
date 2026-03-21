<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface CellProps {
  title?: string | number;
  value?: string | number;
  label?: string | number;
  icon?: string;
  isLink?: boolean;
  required?: boolean;
  center?: boolean;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  border?: boolean;
  clickable?: boolean | null;
  size?: 'normal' | 'large';
}

const props = withDefaults(defineProps<CellProps>(), {
  isLink: false,
  required: false,
  center: false,
  border: true,
  clickable: null,
  size: 'normal',
});

const emit = defineEmits<{
  click: [event: any];
}>();

const isClickable = computed(() => {
  if (props.clickable !== null) return props.clickable;
  return props.isLink;
});

const cellStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: props.center ? 'center' : 'flex-start',
  padding: props.size === 'large' ? 12 : 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

const titleStyle = computed(() => ({
  fontSize: props.size === 'large' ? 16 : 14,
  color: '#323233',
  flex: 1,
}));

const valueStyle = computed(() => ({
  fontSize: props.size === 'large' ? 16 : 14,
  color: '#969799',
  textAlign: 'right' as const,
}));

const labelStyle = computed(() => ({
  fontSize: 12,
  color: '#969799',
  marginTop: 4,
}));

const arrowChar = computed(() => {
  const map = { up: '\u2303', down: '\u2304', left: '\u2039', right: '\u203A' };
  return map[props.arrowDirection || 'right'];
});

function onTap(event: any) {
  if (isClickable.value) {
    emit('click', event);
  }
}
</script>

<template>
  <view :style="cellStyle" @tap="onTap">
    <!-- Left icon -->
    <slot name="icon" />

    <!-- Title section -->
    <view :style="{ flex: 1 }">
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <text v-if="required" :style="{ color: '#ee0a24', marginRight: 2 }">*</text>
        <slot name="title">
          <text v-if="title !== undefined" :style="titleStyle">{{ title }}</text>
        </slot>
      </view>
      <slot name="label">
        <text v-if="label !== undefined" :style="labelStyle">{{ label }}</text>
      </slot>
    </view>

    <!-- Value section -->
    <slot name="value">
      <text v-if="value !== undefined" :style="valueStyle">{{ value }}</text>
    </slot>

    <!-- Arrow -->
    <text v-if="isLink" :style="{ fontSize: 16, color: '#969799', marginLeft: 4 }">{{ arrowChar }}</text>
  </view>
</template>
