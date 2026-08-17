<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as <view> (Lynx has no HTML tags)
  - nativeType: accepted for API compat but not applicable in Lynx (no form submission)
  - url/to/replace: accepted for API compat but routing requires Lynx navigation API
  - ::before active overlay: Lynx has no pseudo-elements; uses opacity class for active feedback
  - ::after hairline border: Lynx has no pseudo-elements; uses border-width: 0.5px instead
  - cursor: not applicable in Lynx (no mouse cursor)
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';
import type {
  ButtonType,
  ButtonSize,
  ButtonNativeType,
  ButtonIconPosition,
} from './types';
import './index.less';

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

const [, bem] = createNamespace('button');

const isActive = ref(false);

const classes = computed(() => {
  return bem([
    props.type,
    props.size,
    {
      plain: props.plain,
      block: props.block,
      round: props.round,
      square: props.square,
      loading: props.loading,
      disabled: props.disabled,
      hairline: props.hairline,
      active: isActive.value && !props.loading && !props.disabled,
    },
  ]);
});

// Inline styles ONLY for the `color` prop — matching Vant's getStyle()
const colorStyle = computed(() => {
  const { color, plain } = props;
  if (!color) return undefined;

  const style: Record<string, string> = {};

  if (plain) {
    style.color = color;
  } else {
    style.color = 'white';
    // Use background instead of backgroundColor to make linear-gradient work
    style.background = color;
  }

  if (color.includes('gradient')) {
    style.borderWidth = '0px';
  } else {
    style.borderColor = color;
  }

  return style;
});

function onClick(event: any) {
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
    :class="classes"
    :style="colorStyle"
    @tap="onClick"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view :class="bem('content')">
      <!-- Left icon / loading -->
      <template v-if="iconPosition === 'left'">
        <template v-if="loading">
          <view :class="bem('loading')">
            <slot name="loading">
              <Loading
                :type="loadingType"
                :size="loadingSize"
              />
            </slot>
          </view>
        </template>
        <template v-else>
          <view v-if="icon || $slots.icon" :class="bem('icon')">
            <slot name="icon">
              <Icon
                v-if="icon"
                :name="icon"
                :class-prefix="iconPrefix"
              />
            </slot>
          </view>
        </template>
      </template>

      <!-- Text -->
      <template v-if="loading && loadingText">
        <text :class="bem('text')">{{ loadingText }}</text>
      </template>
      <template v-else-if="!loading">
        <slot>
          <text v-if="text" :class="bem('text')">{{ text }}</text>
        </slot>
      </template>

      <!-- Right icon / loading -->
      <template v-if="iconPosition === 'right'">
        <template v-if="loading">
          <view :class="bem('loading')">
            <slot name="loading">
              <Loading
                :type="loadingType"
                :size="loadingSize"
              />
            </slot>
          </view>
        </template>
        <template v-else>
          <view v-if="icon || $slots.icon" :class="bem('icon')">
            <slot name="icon">
              <Icon
                v-if="icon"
                :name="icon"
                :class-prefix="iconPrefix"
              />
            </slot>
          </view>
        </template>
      </template>
    </view>
  </view>
</template>
