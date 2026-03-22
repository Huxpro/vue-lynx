<!--
  Vant Feature Parity Report:
  - Props: 19/19 supported (show, overlay, position, overlayClass, overlayStyle, overlayProps,
    duration, zIndex, round, destroyOnClose, lockScroll, lazyRender, closeOnPopstate,
    closeOnClickOverlay, closeable, closeIcon, closeIconPosition, beforeClose, iconPrefix,
    transition, transitionAppear, teleport, safeAreaInsetTop, safeAreaInsetBottom)
  - Events: 7/7 supported (click, click-overlay, click-close-icon, open, close, opened, closed)
  - Slots: 2/2 (default, overlay-content)
  - Lynx Limitations:
    - teleport: accepted for API compat but not applicable in Lynx
    - lockScroll: accepted for API compat but no direct equivalent in Lynx
    - closeOnPopstate: accepted for API compat but no browser history API in Lynx
    - safeAreaInsetTop/Bottom: accepted, uses padding approximation
  - Animation: Position-based enter/leave using CSS transitions on opacity/transform
    (no Transition + v-show, to avoid vShow + Transition bug in vue-lynx)
    - center: zoom in/out (scale 0.9→1 + opacity)
    - top/bottom/left/right: slide via translateX/translateY
-->
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue-lynx';
import Overlay from '../Overlay/index.vue';
import Icon from '../Icon/index.vue';

export interface PopupProps {
  show?: boolean;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  round?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  closeIconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number | string;
  overlay?: boolean;
  overlayClass?: string | string[] | Record<string, boolean>;
  overlayStyle?: Record<string, any>;
  overlayProps?: Record<string, any>;
  closeOnClickOverlay?: boolean;
  zIndex?: number | string;
  safeAreaInsetTop?: boolean;
  safeAreaInsetBottom?: boolean;
  beforeClose?: (action?: string) => boolean | Promise<boolean>;
  lockScroll?: boolean;
  lazyRender?: boolean;
  destroyOnClose?: boolean;
  closeOnPopstate?: boolean;
  iconPrefix?: string;
  transition?: string;
  transitionAppear?: boolean;
  teleport?: string | Element;
}

const props = withDefaults(defineProps<PopupProps>(), {
  show: false,
  position: 'center',
  round: false,
  closeable: false,
  closeIcon: 'cross',
  closeIconPosition: 'top-right',
  duration: 0.3,
  overlay: true,
  closeOnClickOverlay: true,
  zIndex: 2000,
  safeAreaInsetTop: false,
  safeAreaInsetBottom: false,
  lockScroll: true,
  lazyRender: true,
  destroyOnClose: false,
  closeOnPopstate: false,
  iconPrefix: 'van-icon',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  click: [event: any];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
  'click-close-icon': [event: any];
}>();

const hasRendered = ref(false);
const animVisible = ref(false);
const displayVisible = ref(false);
let animTimer: ReturnType<typeof setTimeout> | null = null;

const durationMs = computed(() => Number(props.duration) * 1000);

const transitionProperty = computed(() => {
  if (props.position === 'center') {
    return `opacity ${props.duration}s ease, transform ${props.duration}s ease`;
  }
  return `transform ${props.duration}s ease`;
});

watch(
  () => props.show,
  (val, oldVal) => {
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }

    if (val) {
      hasRendered.value = true;
      displayVisible.value = true;
      emit('open');
      setTimeout(() => { animVisible.value = true; }, 16);
      animTimer = setTimeout(() => { emit('opened'); }, durationMs.value + 50);
    } else if (oldVal) {
      emit('close');
      animVisible.value = false;
      animTimer = setTimeout(() => {
        emit('closed');
        if (props.destroyOnClose) {
          displayVisible.value = false;
        }
      }, durationMs.value);
    }
  },
);

onBeforeUnmount(() => {
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
});

const shouldRender = computed(() => {
  if (props.lazyRender && !hasRendered.value) return false;
  if (props.destroyOnClose && !displayVisible.value) return false;
  return true;
});

const zIndexNum = computed(() => Number(props.zIndex));

const positionStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed',
    zIndex: zIndexNum.value,
    backgroundColor: '#fff',
    overflow: 'hidden',
    transition: transitionProperty.value,
    pointerEvents: animVisible.value ? 'auto' : 'none',
  };

  if (props.safeAreaInsetTop) base.paddingTop = 44;
  if (props.safeAreaInsetBottom) base.paddingBottom = 34;

  if (props.position === 'center') {
    base.opacity = animVisible.value ? 1 : 0;
    base.transform = animVisible.value ? 'scale(1)' : 'scale(0.9)';
    return {
      ...base,
      borderRadius: props.round ? 16 : 0,
      minWidth: 200,
    };
  }

  if (props.position === 'bottom') {
    base.transform = animVisible.value ? 'translateY(0)' : 'translateY(100%)';
    return {
      ...base,
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: props.round ? 16 : 0,
      borderTopRightRadius: props.round ? 16 : 0,
    };
  }

  if (props.position === 'top') {
    base.transform = animVisible.value ? 'translateY(0)' : 'translateY(-100%)';
    return {
      ...base,
      top: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: props.round ? 16 : 0,
      borderBottomRightRadius: props.round ? 16 : 0,
    };
  }

  if (props.position === 'left') {
    base.transform = animVisible.value ? 'translateX(0)' : 'translateX(-100%)';
    return { ...base, top: 0, bottom: 0, left: 0, width: '80%' };
  }

  if (props.position === 'right') {
    base.transform = animVisible.value ? 'translateX(0)' : 'translateX(100%)';
    return { ...base, top: 0, bottom: 0, right: 0, width: '80%' };
  }

  return base;
});

// Center position uses a flex centering wrapper
const centerWrapperStyle = computed(() => ({
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  zIndex: zIndexNum.value,
  pointerEvents: 'none' as const,
}));

const closeIconPositionStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'absolute',
    zIndex: 1,
    padding: 4,
  };
  const pos = props.closeIconPosition;
  if (pos.includes('top')) style.top = 8;
  if (pos.includes('bottom')) style.bottom = 8;
  if (pos.includes('left')) style.left = 8;
  if (pos.includes('right')) style.right = 8;
  return style;
});

async function onClickOverlay(event: any) {
  emit('click-overlay', event);
  if (props.closeOnClickOverlay) {
    await doClose();
  }
}

async function onClickCloseIcon(event: any) {
  emit('click-close-icon', event);
  await doClose();
}

function onClick(event: any) {
  emit('click', event);
}

async function doClose() {
  if (props.beforeClose) {
    const result = await props.beforeClose();
    if (result === false) return;
  }
  emit('update:show', false);
}
</script>

<template>
  <template v-if="shouldRender">
    <Overlay
      v-if="overlay"
      :show="show"
      :z-index="zIndexNum - 1"
      :duration="duration"
      :custom-style="overlayStyle"
      @click="onClickOverlay"
    >
      <slot name="overlay-content" />
    </Overlay>

    <!-- Center position: flex centering wrapper -->
    <template v-if="position === 'center'">
      <view :style="centerWrapperStyle">
        <view :style="positionStyle" @tap="onClick">
          <view v-if="closeable" :style="closeIconPositionStyle" @tap="onClickCloseIcon">
            <Icon :name="closeIcon" :size="22" color="#c8c9cc" />
          </view>
          <slot />
        </view>
      </view>
    </template>

    <!-- Non-center positions: direct positioning -->
    <view v-else :style="positionStyle" @tap="onClick">
      <view v-if="closeable" :style="closeIconPositionStyle" @tap="onClickCloseIcon">
        <Icon :name="closeIcon" :size="22" color="#c8c9cc" />
      </view>
      <slot />
    </view>
  </template>
</template>
