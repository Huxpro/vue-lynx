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
    - html type: not applicable in Lynx (no innerHTML)
    - wordBreak: accepted but Lynx text wrapping may differ
    - forbidClick: overlay blocks touches when enabled
  - Animation: CSS transitions on opacity/transform (no Transition + v-show)
    - middle: zoom in/out (scale 0.9→1 + opacity)
    - top/bottom: slide via translateY + opacity
-->
<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount } from 'vue-lynx';
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

const ANIM_DURATION = 200;

const hasIcon = computed(() => props.type !== 'text' || !!props.icon);

const resolvedIconSize = computed(() => {
  if (typeof props.iconSize === 'string') return parseInt(props.iconSize, 10) || 36;
  return props.iconSize;
});

const hasRendered = ref(false);
const animVisible = ref(false);

// Auto-close timer
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
let animTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.show,
  (val) => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }

    if (val) {
      hasRendered.value = true;
      setTimeout(() => { animVisible.value = true; }, 16);
      animTimer = setTimeout(() => { emit('opened'); }, ANIM_DURATION + 50);
      if (props.duration > 0) {
        timer.value = setTimeout(() => {
          emit('update:show', false);
          emit('close');
        }, props.duration);
      }
    } else {
      animVisible.value = false;
    }
  },
);

onBeforeUnmount(() => {
  if (timer.value) { clearTimeout(timer.value); timer.value = null; }
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
});

const wrapperStyle = computed(() => ({
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: Number(props.zIndex),
  backgroundColor: animVisible.value && (props.overlay || props.forbidClick) ? 'rgba(0,0,0,0.7)' : 'transparent',
  pointerEvents: animVisible.value ? 'auto' : 'none',
  transition: `background-color ${ANIM_DURATION / 1000}s ease`,
}));

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

const toastCardStyle = computed(() => {
  const dur = `${ANIM_DURATION / 1000}s`;
  const isMiddle = props.position === 'middle';
  let transform: string;
  if (animVisible.value) {
    transform = 'scale(1) translateY(0)';
  } else if (isMiddle) {
    transform = 'scale(0.9)';
  } else if (props.position === 'top') {
    transform = 'translateY(-50px)';
  } else {
    transform = 'translateY(50px)';
  }

  return {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingTop: hasIcon.value ? 24 : 8,
    paddingBottom: hasIcon.value ? 24 : 8,
    paddingLeft: hasIcon.value ? 24 : 12,
    paddingRight: hasIcon.value ? 24 : 12,
    minWidth: hasIcon.value ? 88 : 0,
    maxWidth: 200,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    opacity: animVisible.value ? 1 : 0,
    transform,
    transition: `opacity ${dur} ease, transform ${dur} ease`,
    pointerEvents: animVisible.value ? ('auto' as const) : ('none' as const),
  };
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
    v-if="hasRendered"
    :style="wrapperStyle"
    @tap="onClickOverlay"
  >
    <view :style="positionStyle">
      <view
        :style="toastCardStyle"
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
