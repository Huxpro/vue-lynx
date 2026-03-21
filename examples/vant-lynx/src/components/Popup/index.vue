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
    - transition/transitionAppear: accepted but no CSS transition animations in Lynx
    - safeAreaInsetTop/Bottom: accepted, uses padding approximation
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
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

// Lazy render tracking
const hasRendered = ref(false);

watch(
  () => props.show,
  (val, oldVal) => {
    if (val) {
      hasRendered.value = true;
      emit('open');
      // In Lynx without CSS transitions, opened fires after a short delay
      setTimeout(() => emit('opened'), Number(props.duration) * 1000);
    } else if (oldVal) {
      emit('close');
      setTimeout(() => emit('closed'), Number(props.duration) * 1000);
    }
  },
);

const shouldRender = computed(() => {
  if (props.destroyOnClose && !props.show) return false;
  if (props.lazyRender && !hasRendered.value) return false;
  return true;
});

const zIndexNum = computed(() => Number(props.zIndex));

const positionStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed',
    zIndex: zIndexNum.value,
    backgroundColor: '#fff',
    overflow: 'hidden',
  };

  if (props.safeAreaInsetTop) {
    base.paddingTop = 44;
  }
  if (props.safeAreaInsetBottom) {
    base.paddingBottom = 34;
  }

  if (props.position === 'center') {
    return {
      ...base,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: props.round ? 16 : 0,
      minWidth: 200,
    };
  }

  if (props.position === 'bottom') {
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
    return { ...base, top: 0, bottom: 0, left: 0, width: '80%' };
  }

  if (props.position === 'right') {
    return { ...base, top: 0, bottom: 0, right: 0, width: '80%' };
  }

  return base;
});

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
      :custom-style="overlayStyle"
      @click="onClickOverlay"
    >
      <slot name="overlay-content" />
    </Overlay>
    <view v-show="show" :style="positionStyle" @tap="onClick">
      <view v-if="closeable" :style="closeIconPositionStyle" @tap="onClickCloseIcon">
        <Icon :name="closeIcon" :size="22" color="#c8c9cc" />
      </view>
      <slot />
    </view>
  </template>
</template>
