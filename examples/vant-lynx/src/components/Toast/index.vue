<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - html type: accepted for API compat but no innerHTML in Lynx (renders as plain text)
  - forbidClick: uses transparent overlay to block touches (no document.body class toggle)
  - lockScroll: not applicable in Lynx (no document.body scroll)
-->
<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit, isDef } from '../../utils/format';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';
import Overlay from '../Overlay/index.vue';
import type { ToastType, ToastPosition, ToastWordBreak } from './types';
import './index.less';

export type {
  ToastType,
  ToastPosition,
  ToastWordBreak,
  ToastProps,
  ToastOptions,
  ToastWrapperInstance,
  ToastThemeVars,
} from './types';

const [, bem] = createNamespace('toast');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    type?: ToastType;
    message?: string | number;
    position?: ToastPosition;
    overlay?: boolean;
    icon?: string;
    iconSize?: string | number;
    iconPrefix?: string;
    duration?: number;
    forbidClick?: boolean;
    closeOnClick?: boolean;
    closeOnClickOverlay?: boolean;
    wordBreak?: ToastWordBreak;
    className?: string | string[] | Record<string, any>;
    overlayClass?: string | string[] | Record<string, any>;
    overlayStyle?: Record<string, any>;
    transition?: string;
    teleport?: string | Element;
    zIndex?: number | string;
    loadingType?: 'circular' | 'spinner';
  }>(),
  {
    show: false,
    type: 'text',
    message: '',
    position: 'middle',
    overlay: false,
    duration: 2000,
    forbidClick: false,
    closeOnClick: false,
    closeOnClickOverlay: false,
    transition: 'van-fade',
    zIndex: 2000,
    loadingType: 'circular',
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  close: [];
  opened: [];
}>();

// Lazy render
const hasRendered = ref(false);

watch(
  () => props.show,
  (val) => {
    if (val) hasRendered.value = true;
  },
  { immediate: true },
);

const shouldRender = computed(() => hasRendered.value);

// Icon logic
const isTextType = computed(
  () => props.type === 'text' || props.type === 'html',
);

const hasIcon = computed(
  () => props.type === 'loading' || props.type === 'success' || props.type === 'fail' || !!props.icon,
);

const iconName = computed(() => {
  if (props.icon) return props.icon;
  if (props.type === 'success') return 'success';
  if (props.type === 'fail') return 'fail';
  return '';
});

const iconSizePx = computed(() => addUnit(props.iconSize) ?? '36px');

// Auto-close timer
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

function clearTimer() {
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
}

watch(
  () => [props.show, props.type, props.message, props.duration] as const,
  ([show, _type, _message, duration]) => {
    clearTimer();
    if (show) {
      emit('opened');
      if (duration > 0) {
        timer.value = setTimeout(() => {
          emit('update:show', false);
          emit('close');
        }, duration);
      }
    }
  },
);

onBeforeUnmount(() => {
  clearTimer();
});

// Whether overlay/blocking layer is needed
const needOverlay = computed(
  () => props.overlay || props.forbidClick,
);

// Overlay custom style: transparent when forbidClick only, dark when overlay
const overlayCustomStyle = computed(() => {
  if (props.overlay) {
    return props.overlayStyle;
  }
  // forbidClick without overlay: transparent blocker
  return { backgroundColor: 'transparent', ...props.overlayStyle };
});

// BEM classes for toast
const toastClasses = computed(() => {
  const mods: Array<string | undefined | Record<string, boolean | undefined>> = [
    props.position,
  ];

  // Text/html types get smaller padding
  if (isTextType.value && !props.icon) {
    mods.push(props.type);
  }

  // Word break modifier
  if (props.wordBreak && props.wordBreak !== 'break-all') {
    if (props.wordBreak === 'normal') {
      mods.push('break-normal');
    } else {
      mods.push(props.wordBreak);
    }
  }

  const classes: Array<string | string[] | Record<string, any>> = [bem(mods)];
  if (props.className) {
    if (typeof props.className === 'string') {
      classes.push(props.className);
    } else if (Array.isArray(props.className)) {
      classes.push(...props.className);
    } else {
      classes.push(props.className);
    }
  }
  return classes;
});

// Inline style: only z-index and opacity for fade transition
const toastStyle = computed(() => {
  const style: Record<string, any> = {};
  if (isDef(props.zIndex)) {
    style.zIndex = Number(props.zIndex);
  }
  style.opacity = props.show ? 1 : 0;
  if (!props.show) {
    style.pointerEvents = 'none';
  }
  return style;
});

// Text class: margin-top when there's an icon above
const textClasses = computed(() =>
  bem('text', { only: !hasIcon.value }),
);

function onClickToast() {
  if (props.closeOnClick) {
    emit('update:show', false);
    emit('close');
  }
}

function onClickOverlay() {
  if (props.closeOnClickOverlay) {
    emit('update:show', false);
    emit('close');
  }
}
</script>

<template>
  <!-- Overlay: blocks touches when overlay=true or forbidClick=true -->
  <Overlay
    v-if="shouldRender && needOverlay"
    :show="show"
    :z-index="zIndex"
    :custom-style="overlayCustomStyle"
    :class-name="overlayClass"
    @click="onClickOverlay"
  />

  <!-- Toast box -->
  <view
    v-if="shouldRender"
    :class="toastClasses"
    :style="toastStyle"
    @tap.stop="onClickToast"
  >
    <!-- Loading type -->
    <Loading
      v-if="type === 'loading'"
      :class="bem('loading')"
      :type="loadingType"
      :size="iconSizePx"
      color="white"
    />

    <!-- Icon (success/fail/custom) -->
    <Icon
      v-else-if="iconName"
      :class="bem('icon')"
      :name="iconName"
      :size="iconSizePx"
      color="white"
      :class-prefix="iconPrefix"
    />

    <!-- Message -->
    <slot name="message">
      <text
        v-if="message"
        :class="textClasses"
      >{{ message }}</text>
    </slot>
  </view>
</template>
