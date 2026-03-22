<!--
  Lynx Limitations:
  - teleport: accepted for API compat but not applicable in Lynx (no DOM mounting)
  - transition: accepted but no CSS transition animation in Lynx
  - html type: accepted for API compat but no innerHTML in Lynx (renders as text)
  - wordBreak: accepted but Lynx text wrapping may differ from web
  - forbidClick: uses overlay to block touches (no document.body class toggle)
  - className: accepted for API compat but no CSS class system in Lynx
  - overlayClass: accepted for API compat but no CSS class system in Lynx
  - iconPrefix: accepted for API compat but no icon font in Lynx
-->
<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount } from 'vue-lynx';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';
import type { ToastType, ToastPosition, ToastWordBreak } from './types';

export type {
  ToastType,
  ToastPosition,
  ToastWordBreak,
  ToastProps,
  ToastOptions,
  ToastWrapperInstance,
  ToastThemeVars,
} from './types';

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

const hasIcon = computed(
  () => props.type === 'loading' || props.type === 'success' || props.type === 'fail' || !!props.icon,
);

const iconSizePx = computed(() => {
  if (props.iconSize == null) return '36px';
  if (typeof props.iconSize === 'number') return `${props.iconSize}px`;
  return props.iconSize;
});

const iconSizeNum = computed(() => {
  return parseInt(String(iconSizePx.value), 10) || 36;
});

// Auto-close timer
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

function clearTimer() {
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
}

watch(
  () => [props.show, props.duration] as const,
  ([show, duration]) => {
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

// Container style (full-screen overlay layer)
const containerStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Number(props.zIndex),
  };

  // Overlay or forbidClick shows a blocking layer
  if (props.overlay) {
    style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  } else if (props.forbidClick) {
    style.backgroundColor = 'transparent';
  } else {
    // No overlay, no forbidClick: allow clicks to pass through
    style.backgroundColor = 'transparent';
    style.pointerEvents = 'none';
  }

  return style;
});

// Position wrapper style
const positionStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (props.position === 'top') {
    return { ...base, top: '20%' };
  }
  if (props.position === 'bottom') {
    return { ...base, bottom: '20%' };
  }
  // middle
  return { ...base, top: '45%' };
});

// Toast box style
const toastStyle = computed(() => {
  const isTextType = props.type === 'text' || props.type === 'html';
  const hasIconOrType = hasIcon.value;

  const style: Record<string, any> = {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  };

  if (hasIconOrType && !isTextType) {
    // Icon/loading/success/fail style: fixed width box
    style.paddingTop = '16px';
    style.paddingBottom = '16px';
    style.paddingLeft = '16px';
    style.paddingRight = '16px';
    style.minWidth = '88px';
    style.minHeight = '88px';
    style.maxWidth = '70%';
  } else {
    // Text style: fit content
    style.paddingTop = '8px';
    style.paddingBottom = '8px';
    style.paddingLeft = '12px';
    style.paddingRight = '12px';
    style.minWidth = '96px';
    style.maxWidth = '70%';
  }

  return style;
});

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
  <view v-if="show" :style="containerStyle" @tap="onClickOverlay">
    <view :style="positionStyle">
      <view :style="toastStyle" @tap.stop="onClickToast">
        <!-- Loading type -->
        <Loading
          v-if="type === 'loading'"
          :type="loadingType"
          :size="iconSizeNum"
          color="#fff"
          :style="{ marginBottom: message ? '8px' : '0px' }"
        />

        <!-- Success icon -->
        <Icon
          v-else-if="type === 'success'"
          name="success"
          :size="iconSizeNum"
          color="#fff"
          :style="{ marginBottom: message ? '8px' : '0px' }"
        />

        <!-- Fail icon -->
        <Icon
          v-else-if="type === 'fail'"
          name="fail"
          :size="iconSizeNum"
          color="#fff"
          :style="{ marginBottom: message ? '8px' : '0px' }"
        />

        <!-- Custom icon -->
        <Icon
          v-else-if="icon"
          :name="icon"
          :size="iconSizeNum"
          color="#fff"
          :style="{ marginBottom: message ? '8px' : '0px' }"
        />

        <!-- Message -->
        <slot name="message">
          <text
            v-if="message"
            :style="{
              fontSize: '14px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '20px',
            }"
          >{{ message }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
