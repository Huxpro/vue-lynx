<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML tags)
  - nativeType: accepted for API compat but not applicable in Lynx (no form submission)
  - url/to/replace: accepted for API compat but routing requires Lynx navigation API
  - ::before active overlay: Lynx has no pseudo-elements, uses opacity for active feedback
  - hairline ::after border: Lynx has no pseudo-elements, uses 0.5px border-width instead
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';
import type {
  ButtonType,
  ButtonSize,
  ButtonNativeType,
  ButtonIconPosition,
} from './types';

export interface ButtonProps {
  type?: ButtonType;
  size?: ButtonSize;
  text?: string;
  plain?: boolean;
  round?: boolean;
  square?: boolean;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: string;
  iconPrefix?: string;
  iconPosition?: ButtonIconPosition;
  loadingText?: string;
  loadingSize?: string | number;
  loadingType?: 'circular' | 'spinner';
  color?: string;
  hairline?: boolean;
  tag?: string;
  nativeType?: ButtonNativeType;
  url?: string;
  to?: string | Record<string, any>;
  replace?: boolean;
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
  loadingType: 'circular',
});

const emit = defineEmits<{
  click: [event: any];
}>();

const isActive = ref(false);

const sizeConfig = {
  large: { height: '50px', fontSize: '16px', padding: '0px' },
  normal: { height: '44px', fontSize: '16px', padding: '15px' },
  small: { height: '32px', fontSize: '14px', padding: '8px' },
  mini: { height: '24px', fontSize: '12px', padding: '4px' },
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

const loadingColor = computed(() => {
  if (props.plain) {
    const tc = typeConfig[props.type];
    return props.color || (tc.bg === '#fff' ? '#c9c9c9' : tc.bg);
  }
  if (props.color) return '#fff';
  const tc = typeConfig[props.type];
  return tc.color === '#fff' ? '#fff' : '#c9c9c9';
});

const resolvedLoadingSize = computed(() => {
  if (props.loadingSize) {
    if (typeof props.loadingSize === 'string') {
      return /^\d+$/.test(props.loadingSize) ? `${props.loadingSize}px` : props.loadingSize;
    }
    return `${props.loadingSize}px`;
  }
  return '20px';
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

  const borderWidth = isGradient ? '0px' : (props.hairline ? '0.5px' : '1px');
  const borderRadius = props.round ? '999px' : (props.square ? '0px' : '4px');

  return {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: sz.height,
    paddingLeft: props.size === 'large' || props.block ? '0px' : sz.padding,
    paddingRight: props.size === 'large' || props.block ? '0px' : sz.padding,
    backgroundColor: bg,
    borderWidth,
    borderStyle: 'solid' as const,
    borderColor: borderColor,
    borderRadius,
    opacity: props.disabled ? 0.5 : (isActive.value && !props.loading ? 0.9 : 1),
    width: props.block ? '100%' : undefined,
  };
});

const textStyle = computed(() => {
  const sz = sizeConfig[props.size];
  const fontSizeNum = parseInt(sz.fontSize, 10);
  return {
    fontSize: sz.fontSize,
    color: textColor.value,
    lineHeight: `${Math.round(fontSizeNum * 1.2)}px`,
  };
});

const iconSize = computed(() => {
  return sizeConfig[props.size].fontSize;
});

const iconTextSpacingStyle = computed(() => ({
  width: '4px',
}));

function onTap(event: any) {
  if (props.loading || props.disabled) return;
  emit('click', event);
}

function onTouchStart() {
  if (!props.loading && !props.disabled) {
    isActive.value = true;
  }
}

function onTouchEnd() {
  isActive.value = false;
}
</script>

<template>
  <view
    :style="buttonStyle"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Loading state -->
    <template v-if="loading">
      <slot name="loading">
        <Loading
          :type="loadingType"
          :size="resolvedLoadingSize"
          :color="loadingColor"
        />
      </slot>
      <view v-if="loadingText" :style="iconTextSpacingStyle" />
      <text v-if="loadingText" :style="textStyle">{{ loadingText }}</text>
    </template>

    <!-- Normal state -->
    <template v-else>
      <!-- Left icon -->
      <template v-if="iconPosition === 'left'">
        <slot name="icon">
          <Icon
            v-if="icon"
            :name="icon"
            :size="iconSize"
            :color="textColor"
          />
        </slot>
        <view v-if="icon || $slots.icon" :style="iconTextSpacingStyle" />
      </template>

      <!-- Button text -->
      <slot>
        <text v-if="text" :style="textStyle">{{ text }}</text>
      </slot>

      <!-- Right icon -->
      <template v-if="iconPosition === 'right'">
        <view v-if="icon || $slots.icon" :style="iconTextSpacingStyle" />
        <slot name="icon">
          <Icon
            v-if="icon"
            :name="icon"
            :size="iconSize"
            :color="textColor"
          />
        </slot>
      </template>
    </template>
  </view>
</template>
