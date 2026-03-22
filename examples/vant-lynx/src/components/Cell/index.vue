<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML tags)
  - url/to/replace: accepted for API compat but routing requires Lynx navigation API
  - titleClass/valueClass/labelClass: accepted for API compat but no CSS class in Lynx
  - iconPrefix: accepted for API compat but unused (no icon font)
  - ::before required asterisk: Lynx has no pseudo-elements, uses inline text element
  - ::after hairline border: Lynx has no pseudo-elements, uses border-bottom instead
  - :active background: Lynx has no :active pseudo-class, uses touchstart/touchend
  - role/tabindex: not applicable in Lynx
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { CellSize, CellArrowDirection } from './types';

export interface CellProps {
  tag?: string;
  icon?: string;
  size?: CellSize;
  title?: string | number;
  value?: string | number;
  label?: string | number;
  center?: boolean;
  isLink?: boolean;
  border?: boolean;
  iconPrefix?: string;
  valueClass?: unknown;
  labelClass?: unknown;
  titleClass?: unknown;
  titleStyle?: string | Record<string, any>;
  arrowDirection?: CellArrowDirection;
  required?: boolean | 'auto' | null;
  clickable?: boolean | null;
  url?: string;
  to?: string | Record<string, any>;
  replace?: boolean;
}

const props = withDefaults(defineProps<CellProps>(), {
  tag: 'div',
  border: true,
  clickable: null,
  required: null,
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

const cellStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: props.center ? 'center' : 'flex-start',
    paddingTop: props.size === 'large' ? '12px' : '10px',
    paddingBottom: props.size === 'large' ? '12px' : '10px',
    paddingLeft: '16px',
    paddingRight: '16px',
    backgroundColor: isActive.value && isClickable.value ? '#f2f3f5' : '#fff',
    fontSize: '14px',
    lineHeight: '24px',
  };

  if (props.border) {
    style.borderBottomWidth = '0.5px';
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  }

  return style;
});

const titleTextStyle = computed(() => {
  const base: Record<string, any> = {
    fontSize: props.size === 'large' ? '16px' : '14px',
    color: '#323233',
    lineHeight: '24px',
  };
  if (props.titleStyle && typeof props.titleStyle === 'object') {
    Object.assign(base, props.titleStyle);
  }
  return base;
});

const valueTextStyle = computed(() => ({
  fontSize: props.size === 'large' ? 'inherit' : 'inherit',
  color: '#969799',
  lineHeight: '24px',
  textAlign: 'right' as const,
}));

const labelTextStyle = computed(() => ({
  fontSize: props.size === 'large' ? '14px' : '12px',
  color: '#969799',
  marginTop: '4px',
  lineHeight: '18px',
}));

const arrowName = computed(() => {
  if (!props.arrowDirection || props.arrowDirection === 'right') return 'arrow';
  return `arrow-${props.arrowDirection}`;
});

function onTap(event: any) {
  emit('click', event);
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
      <view v-if="icon" :style="{ marginRight: '4px', display: 'flex', alignItems: 'center', height: '24px' }">
        <Icon :name="icon" :size="16" color="#323233" />
      </view>
    </slot>

    <!-- Title section -->
    <view v-if="$slots.title || title !== undefined" :style="{ flex: 1 }">
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <slot name="title">
          <text :style="titleTextStyle">{{ title }}</text>
        </slot>
      </view>
      <slot name="label">
        <text v-if="label !== undefined" :style="labelTextStyle">{{ label }}</text>
      </slot>
    </view>

    <!-- Required asterisk (positioned before title) -->
    <text
      v-if="required"
      :style="{
        color: '#ee0a24',
        fontSize: '14px',
        position: 'absolute',
        left: '4px',
      }"
    >*</text>

    <!-- Value section (default slot is alias of value) -->
    <view :style="{ flex: ($slots.title || title !== undefined) ? undefined : 1, overflow: 'hidden' }">
      <slot name="value">
        <slot>
          <text v-if="value !== undefined" :style="valueTextStyle">{{ value }}</text>
        </slot>
      </slot>
    </view>

    <!-- Right icon -->
    <slot name="right-icon">
      <view v-if="isLink" :style="{ marginLeft: '4px', display: 'flex', alignItems: 'center', height: '24px' }">
        <Icon :name="arrowName" :size="16" color="#969799" />
      </view>
    </slot>

    <!-- Extra content -->
    <slot name="extra" />
  </view>
</template>
