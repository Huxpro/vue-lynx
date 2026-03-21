<!--
  Vant Feature Parity Report:
  - Props: 13/18 supported (missing: tag [N/A], iconPrefix, valueClass/labelClass/titleClass [N/A class-based], to/url/replace [routing])
  - Events: 1/1 supported (click)
  - Slots: 6/6 supported (title, label, value/default, icon, right-icon, extra)
  - CSS Variables: Hardcoded - matches Vant defaults
  - Dark Mode: Not yet integrated
  - Click Feedback: Active state background color
  - Gaps:
    - No routing integration (to/url/replace)
    - tag/class props not applicable in Lynx
    - iconPrefix not implemented
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

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
  titleStyle?: Record<string, any>;
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
  if (props.titleStyle) {
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
        <Icon
          :name="arrowDirection ? `arrow-${arrowDirection === 'right' ? '' : arrowDirection}` : 'arrow'"
          :size="16"
          color="#969799"
        />
      </view>
    </slot>

    <!-- Extra content -->
    <slot name="extra" />
  </view>
</template>
