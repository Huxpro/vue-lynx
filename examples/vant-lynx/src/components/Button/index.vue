<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ButtonProps {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'large' | 'normal' | 'small' | 'mini';
  text?: string;
  plain?: boolean;
  round?: boolean;
  square?: boolean;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loadingText?: string;
  color?: string;
  hairline?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'default',
  size: 'normal',
  plain: false,
  round: false,
  square: false,
  disabled: false,
  loading: false,
  block: false,
  iconPosition: 'left',
  hairline: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const sizeConfig = {
  large: { height: 50, fontSize: 16, padding: 0 },
  normal: { height: 44, fontSize: 16, padding: 15 },
  small: { height: 32, fontSize: 14, padding: 8 },
  mini: { height: 24, fontSize: 12, padding: 4 },
};

const typeConfig = {
  default: { bg: '#fff', color: '#323233', border: '#ebedf0' },
  primary: { bg: '#1989fa', color: '#fff', border: '#1989fa' },
  success: { bg: '#07c160', color: '#fff', border: '#07c160' },
  warning: { bg: '#ff976a', color: '#fff', border: '#ff976a' },
  danger: { bg: '#ee0a24', color: '#fff', border: '#ee0a24' },
};

const textColor = computed(() => {
  const tc = typeConfig[props.type];
  if (props.color) return props.plain ? props.color : '#fff';
  if (props.plain) return tc.bg === '#fff' ? '#323233' : tc.bg;
  return tc.color;
});

const buttonStyle = computed(() => {
  const sz = sizeConfig[props.size];
  const tc = typeConfig[props.type];

  let bg = tc.bg;
  let borderColor = tc.border;

  if (props.plain) {
    bg = '#fff';
  }

  if (props.color) {
    bg = props.plain ? '#fff' : props.color;
    borderColor = props.color;
  }

  const isGradient = props.color?.includes('gradient');

  return {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: sz.height,
    paddingLeft: props.size === 'large' ? 0 : sz.padding,
    paddingRight: props.size === 'large' ? 0 : sz.padding,
    backgroundColor: bg,
    borderWidth: isGradient ? 0 : (props.hairline ? 0.5 : 1),
    borderStyle: 'solid' as const,
    borderColor: borderColor,
    borderRadius: props.round ? 999 : (props.square ? 0 : 4),
    opacity: props.disabled ? 0.5 : 1,
  };
});

const textStyle = computed(() => {
  const sz = sizeConfig[props.size];
  return {
    fontSize: sz.fontSize,
    color: textColor.value,
    lineHeight: sz.fontSize * 1.2,
  };
});

function onTap(event: any) {
  if (props.loading || props.disabled) return;
  emit('click', event);
}
</script>

<template>
  <view :style="buttonStyle" @tap="onTap">
    <!-- Loading state -->
    <template v-if="loading">
      <slot name="loading">
        <text :style="textStyle">...</text>
      </slot>
      <text v-if="loadingText" :style="{ ...textStyle, marginLeft: 4 }">{{ loadingText }}</text>
    </template>

    <!-- Normal state -->
    <template v-else>
      <slot name="icon" v-if="iconPosition === 'left'" />
      <slot>
        <text v-if="text" :style="textStyle">{{ text }}</text>
      </slot>
      <slot name="icon" v-if="iconPosition === 'right'" />
    </template>
  </view>
</template>
