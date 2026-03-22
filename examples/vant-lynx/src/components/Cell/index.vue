<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML tags)
  - url/to/replace: accepted for API compat but routing requires Lynx navigation API
  - ::before required asterisk: Lynx has no pseudo-elements, uses <text> element
  - ::after hairline border: Lynx has no pseudo-elements, uses border-bottom 0.5px
  - :active background: Lynx has no :active pseudo-class, uses touchstart/touchend with --active class
  - role/tabindex: not applicable in Lynx
  - CSS inherit for font-size: Lynx CSS doesn't inherit by default, font-size applied directly to <text> elements
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import Icon from '../Icon/index.vue';
import type { CellSize, CellArrowDirection } from './types';
import './index.less';

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

const [, bem] = createNamespace('cell');

const isActive = ref(false);

const isClickable = computed(() => {
  if (props.clickable !== null) return props.clickable;
  return props.isLink;
});

const cellClass = computed(() => {
  return bem([
    props.size,
    {
      center: props.center,
      required: !!props.required,
      clickable: !!isClickable.value,
      borderless: !props.border,
      active: isActive.value && !!isClickable.value,
    },
  ]);
});

const hasTitle = computed(() => {
  return isDef(props.title);
});

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
    :class="cellClass"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Required asterisk (replaces ::before pseudo-element) -->
    <text
      v-if="required"
      :class="bem('required-asterisk')"
    >*</text>

    <!-- Left icon -->
    <slot name="icon">
      <view v-if="icon" :class="bem('left-icon')">
        <Icon :name="icon" :size="16" />
      </view>
    </slot>

    <!-- Title section -->
    <view v-if="$slots.title || hasTitle" :class="[bem('title'), titleClass]" :style="titleStyle">
      <slot name="title">
        <text>{{ title }}</text>
      </slot>
      <slot name="label">
        <view v-if="isDef(label)" :class="[bem('label'), labelClass]">
          <text>{{ label }}</text>
        </view>
      </slot>
    </view>

    <!-- Value section (default slot is alias of value) -->
    <view :class="[bem('value'), { 'van-cell__value--alone': !$slots.title && !hasTitle }, valueClass]">
      <slot name="value">
        <slot>
          <text v-if="isDef(value)">{{ value }}</text>
        </slot>
      </slot>
    </view>

    <!-- Right icon -->
    <slot name="right-icon">
      <view v-if="isLink" :class="bem('right-icon')">
        <Icon :name="arrowName" :size="16" />
      </view>
    </slot>

    <!-- Extra content -->
    <slot name="extra" />
  </view>
</template>
