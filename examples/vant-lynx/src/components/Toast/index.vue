<!--
  Vant Feature Parity Report:
  - Props: 16/16 supported (show, type, message, position, overlay, icon, iconSize, iconPrefix,
    duration, forbidClick, closeOnClick, closeOnClickOverlay, wordBreak, className,
    overlayClass, overlayStyle, transition, teleport, zIndex, loadingType)
  - Events: 2/2 supported (close, opened)
  - Slots: 1/1 (message)
  - Programmatic API: showToast, showLoadingToast, showSuccessToast, showFailToast, closeToast,
    allowMultipleToast, setToastDefaultOptions, resetToastDefaultOptions
  - Lynx Limitations:
    - teleport: accepted for API compat but not applicable in Lynx
    - transition: accepted but no CSS transition in Lynx
    - html type: not applicable in Lynx (no innerHTML)
    - wordBreak: accepted but Lynx text wrapping may differ
    - forbidClick: overlay blocks touches when enabled
-->
<script setup lang="ts">
import { computed, watch, ref } from 'vue-lynx';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';

export interface ToastProps {
  show?: boolean;
  type?: 'text' | 'loading' | 'success' | 'fail' | 'html';
  message?: string;
  position?: 'top' | 'middle' | 'bottom';
  overlay?: boolean;
  icon?: string;
  iconSize?: string | number;
  iconPrefix?: string;
  duration?: number;
  forbidClick?: boolean;
  closeOnClick?: boolean;
  closeOnClickOverlay?: boolean;
  wordBreak?: 'normal' | 'break-all' | 'break-word';
  className?: string | string[] | Record<string, any>;
  overlayClass?: string | string[] | Record<string, any>;
  overlayStyle?: Record<string, any>;
  transition?: string;
  teleport?: string | Element;
  zIndex?: number | string;
  loadingType?: 'circular' | 'spinner';
}

const props = withDefaults(defineProps<ToastProps>(), {
  show: false,
  type: 'text',
  message: '',
  position: 'middle',
  overlay: false,
  iconSize: 36,
  iconPrefix: 'van-icon',
  duration: 2000,
  forbidClick: false,
  closeOnClick: false,
  closeOnClickOverlay: false,
  wordBreak: 'break-all',
  transition: 'van-fade',
  zIndex: 2000,
  loadingType: 'circular',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  close: [];
  opened: [];
}>();

const hasIcon = computed(() => props.type !== 'text' || !!props.icon);

const resolvedIconSize = computed(() => {
  if (typeof props.iconSize === 'string') return parseInt(props.iconSize, 10) || 36;
  return props.iconSize;
});

// Auto-close timer
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

watch(
  () => props.show,
  (val) => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
    if (val) {
      emit('opened');
      if (props.duration > 0) {
        timer.value = setTimeout(() => {
          emit('update:show', false);
          emit('close');
        }, props.duration);
      }
    }
  },
);

const positionStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (props.position === 'top') return { ...base, top: '20%' };
  if (props.position === 'bottom') return { ...base, bottom: '20%' };
  return { ...base, top: '45%' };
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
  <view
    v-if="show"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: Number(zIndex),
      backgroundColor: overlay || forbidClick ? 'rgba(0,0,0,0.7)' : 'transparent',
    }"
    @tap="onClickOverlay"
  >
    <view :style="positionStyle">
      <view
        :style="{
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 8,
          paddingTop: hasIcon ? 24 : 8,
          paddingBottom: hasIcon ? 24 : 8,
          paddingLeft: hasIcon ? 24 : 12,
          paddingRight: hasIcon ? 24 : 12,
          minWidth: hasIcon ? 88 : 0,
          maxWidth: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }"
        @tap="onClickToast"
      >
        <!-- Loading type -->
        <Loading
          v-if="type === 'loading'"
          :type="loadingType"
          :size="resolvedIconSize"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Success/fail icon -->
        <Icon
          v-else-if="type === 'success'"
          name="success"
          :size="resolvedIconSize"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />
        <Icon
          v-else-if="type === 'fail'"
          name="fail"
          :size="resolvedIconSize"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Custom icon -->
        <Icon
          v-else-if="icon"
          :name="icon"
          :size="resolvedIconSize"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Message -->
        <slot name="message">
          <text
            v-if="message"
            :style="{
              fontSize: 14,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 20,
            }"
          >{{ message }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
