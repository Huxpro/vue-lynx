<!--
  Vant Feature Parity Report:
  - Props: 18/18 supported (title, value, label, size, icon, iconPrefix, tag, url, to, replace,
    border, center, clickable, isLink, required, arrowDirection, titleStyle, titleClass, valueClass, labelClass)
  - Events: 1/1 supported (click)
  - Slots: 6/6 (title, value, label, icon, right-icon, extra)
  - Lynx Limitations:
    - tag: accepted for API compat but always renders as view
    - url/to/replace: accepted for API compat but routing requires Lynx navigation API
    - titleClass/valueClass/labelClass: accepted for API compat but no CSS class in Lynx
    - iconPrefix: accepted for API compat but unused (no icon font)
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface CellProps {
  title?: string | number;
  value?: string | number;
  label?: string | number;
  icon?: string;
  iconPrefix?: string;
  isLink?: boolean;
  required?: boolean;
  center?: boolean;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  border?: boolean;
  clickable?: boolean | null;
  size?: 'normal' | 'large';
  titleStyle?: string | string[] | Record<string, any>;
  titleClass?: string | string[] | Record<string, any>;
  valueClass?: string | string[] | Record<string, any>;
  labelClass?: string | string[] | Record<string, any>;
  tag?: string;
  url?: string;
  to?: string | Record<string, any>;
  replace?: boolean;
}

const props = withDefaults(defineProps<CellProps>(), {
  isLink: false,
  required: false,
  center: false,
  border: true,
  clickable: null,
  size: 'normal',
  arrowDirection: 'right',
  iconPrefix: 'van-icon',
  tag: 'div',
  replace: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const isActive = ref(false);

const isClickable = computed(() => {
  if (props.clickable !== null) return props.clickable;
  return props.isLink;
});

const cellStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: props.center ? 'center' : 'flex-start',
  paddingTop: props.size === 'large' ? 12 : 10,
  paddingBottom: props.size === 'large' ? 12 : 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: isActive.value && isClickable.value ? '#f2f3f5' : '#fff',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

const titleTextStyle = computed(() => {
  const base: Record<string, any> = {
    fontSize: props.size === 'large' ? 16 : 14,
    color: '#323233',
    lineHeight: 24,
  };
  if (props.titleStyle && typeof props.titleStyle === 'object' && !Array.isArray(props.titleStyle)) {
    Object.assign(base, props.titleStyle);
  }
  return base;
});

const valueTextStyle = computed(() => ({
  fontSize: props.size === 'large' ? 16 : 14,
  color: '#969799',
  lineHeight: 24,
  textAlign: 'right' as const,
}));

const labelTextStyle = computed(() => ({
  fontSize: props.size === 'large' ? 14 : 12,
  color: '#969799',
  marginTop: 4,
  lineHeight: 18,
}));

const arrowName = computed(() => {
  if (props.arrowDirection === 'right') return 'arrow';
  return `arrow-${props.arrowDirection}`;
});

function onTap(event: any) {
  if (isClickable.value) {
    emit('click', event);
  }
}

function onTouchStart() {
  if (isClickable.value) {
    isActive.value = true;
  }
}

function onTouchEnd() {
  isActive.value = false;
}
</script>

<template>
  <view
    :style="cellStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Left icon -->
    <slot name="icon">
      <view v-if="icon" :style="{ marginRight: 4, display: 'flex', alignItems: 'center', height: 24 }">
        <Icon :name="icon" :size="16" color="#323233" />
      </view>
    </slot>

    <!-- Title section -->
    <view :style="{ flex: 1 }">
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <text v-if="required" :style="{ color: '#ee0a24', fontSize: 14, marginRight: 2 }">*</text>
        <slot name="title">
          <text v-if="title !== undefined" :style="titleTextStyle">{{ title }}</text>
        </slot>
      </view>
      <slot name="label">
        <text v-if="label !== undefined" :style="labelTextStyle">{{ label }}</text>
      </slot>
    </view>

    <!-- Value section (default slot is alias of value) -->
    <slot name="value">
      <slot>
        <text v-if="value !== undefined" :style="valueTextStyle">{{ value }}</text>
      </slot>
    </slot>

    <!-- Right icon -->
    <slot name="right-icon">
      <view v-if="isLink" :style="{ marginLeft: 4, display: 'flex', alignItems: 'center', height: 24 }">
        <Icon :name="arrowName" :size="16" color="#969799" />
      </view>
    </slot>

    <!-- Extra content -->
    <slot name="extra" />
  </view>
</template>
