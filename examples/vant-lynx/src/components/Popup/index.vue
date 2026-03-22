<!--
  Lynx Limitations:
  - teleport: accepted for API compat but not applicable in Lynx (no DOM mounting)
  - lockScroll: accepted for API compat but no document.body scroll in Lynx
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - transition/transitionAppear: accepted but Vue <Transition> not supported in Lynx;
    uses inline CSS opacity/transform transitions instead
  - safeAreaInsetTop/Bottom: accepted, uses fixed padding approximation
  - keydown: accepted for API compat but no keyboard events in Lynx
  - iconPrefix: accepted for API compat but no icon font support in Lynx
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import Overlay from '../Overlay/index.vue';
import Icon from '../Icon/index.vue';
import { useLazyRender } from '../../composables/useLazyRender';
import { useGlobalZIndex } from '../../composables/useGlobalZIndex';
import type {
  PopupPosition,
  PopupCloseIconPosition,
  Interceptor,
} from './types';

export type { PopupProps, PopupExpose, PopupThemeVars } from './types';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    position?: PopupPosition;
    round?: boolean;
    closeable?: boolean;
    closeIcon?: string;
    closeIconPosition?: PopupCloseIconPosition;
    duration?: number | string;
    overlay?: boolean;
    overlayClass?: string | string[] | Record<string, boolean>;
    overlayStyle?: Record<string, any>;
    overlayProps?: Record<string, any>;
    closeOnClickOverlay?: boolean;
    zIndex?: number | string;
    safeAreaInsetTop?: boolean;
    safeAreaInsetBottom?: boolean;
    beforeClose?: Interceptor;
    lockScroll?: boolean;
    lazyRender?: boolean;
    destroyOnClose?: boolean;
    closeOnPopstate?: boolean;
    iconPrefix?: string;
    transition?: string;
    transitionAppear?: boolean;
    teleport?: string | object;
  }>(),
  {
    position: 'center',
    closeIcon: 'cross',
    closeIconPosition: 'top-right',
    overlay: true,
    closeOnClickOverlay: true,
    lockScroll: true,
    lazyRender: true,
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  click: [event: any];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
  'click-close-icon': [event: any];
  keydown: [event: any];
}>();

const popupRef = ref();
const opened = ref(false);

// Use global z-index if zIndex prop not explicitly provided
const globalZIndex = useGlobalZIndex();
const zIndexNum = computed(() => {
  if (props.zIndex !== undefined) return Number(props.zIndex);
  return globalZIndex.value;
});

// Lazy render
const lazyInited = useLazyRender(() => props.show);

const shouldRender = computed(() => {
  if (props.destroyOnClose && !props.show) return false;
  if (props.lazyRender && !lazyInited.value) return false;
  return true;
});

// Duration in seconds
const durationSec = computed(() => {
  if (props.duration === undefined || props.duration === null) return 0.3;
  return Number(props.duration);
});

// Watch show for open/close events
watch(
  () => props.show,
  (val, oldVal) => {
    if (val) {
      opened.value = true;
      emit('open');
      // In Lynx without Vue <Transition>, fire opened after duration
      if (durationSec.value > 0) {
        setTimeout(() => emit('opened'), durationSec.value * 1000);
      } else {
        emit('opened');
      }
    } else if (oldVal) {
      emit('close');
      if (durationSec.value > 0) {
        setTimeout(() => {
          opened.value = false;
          emit('closed');
        }, durationSec.value * 1000);
      } else {
        opened.value = false;
        emit('closed');
      }
    }
  },
);

// Popup position styles
const popupStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed',
    zIndex: zIndexNum.value,
    overflow: 'hidden',
    // --van-popup-background defaults to #fff
    backgroundColor: '#fff',
  };

  // Transition animation
  const dur = `${durationSec.value}s`;

  if (props.safeAreaInsetTop) {
    base.paddingTop = '44px';
  }
  if (props.safeAreaInsetBottom) {
    base.paddingBottom = '34px';
  }

  const roundRadius = '16px'; // --van-popup-round-radius

  if (props.position === 'center') {
    Object.assign(base, {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 'calc(100% - 32px)',
    });
    if (props.round) {
      base.borderRadius = roundRadius;
    }
    // Fade transition for center
    base.transitionProperty = 'opacity';
    base.transitionDuration = dur;
    base.opacity = props.show ? 1 : 0;
    if (!props.show) {
      base.pointerEvents = 'none';
    }
  } else if (props.position === 'bottom') {
    Object.assign(base, {
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
    });
    if (props.round) {
      base.borderTopLeftRadius = roundRadius;
      base.borderTopRightRadius = roundRadius;
    }
    // Slide transition
    base.transitionProperty = 'transform';
    base.transitionDuration = dur;
    base.transform = props.show ? 'translateY(0)' : 'translateY(100%)';
    if (!props.show) {
      base.pointerEvents = 'none';
    }
  } else if (props.position === 'top') {
    Object.assign(base, {
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
    });
    if (props.round) {
      base.borderBottomLeftRadius = roundRadius;
      base.borderBottomRightRadius = roundRadius;
    }
    base.transitionProperty = 'transform';
    base.transitionDuration = dur;
    base.transform = props.show ? 'translateY(0)' : 'translateY(-100%)';
    if (!props.show) {
      base.pointerEvents = 'none';
    }
  } else if (props.position === 'left') {
    Object.assign(base, {
      top: 0,
      bottom: 0,
      left: 0,
      height: '100%',
    });
    base.transitionProperty = 'transform';
    base.transitionDuration = dur;
    base.transform = props.show ? 'translateX(0)' : 'translateX(-100%)';
    if (!props.show) {
      base.pointerEvents = 'none';
    }
  } else if (props.position === 'right') {
    Object.assign(base, {
      top: 0,
      bottom: 0,
      right: 0,
      height: '100%',
    });
    base.transitionProperty = 'transform';
    base.transitionDuration = dur;
    base.transform = props.show ? 'translateX(0)' : 'translateX(100%)';
    if (!props.show) {
      base.pointerEvents = 'none';
    }
  }

  return base;
});

// Close icon position styles
const closeIconStyle = computed(() => {
  const margin = '16px'; // --van-popup-close-icon-margin
  const style: Record<string, any> = {
    position: 'absolute',
    zIndex: 1, // --van-popup-close-icon-z-index
  };
  const pos = props.closeIconPosition;
  if (pos.includes('top')) style.top = margin;
  if (pos.includes('bottom')) style.bottom = margin;
  if (pos.includes('left')) style.left = margin;
  if (pos.includes('right')) style.right = margin;
  return style;
});

// Close icon size and color from CSS vars
const closeIconSize = '22px'; // --van-popup-close-icon-size
const closeIconColor = '#c8c9cc'; // --van-popup-close-icon-color

async function doClose() {
  if (props.beforeClose) {
    const result = await props.beforeClose();
    if (result === false) return;
  }
  emit('update:show', false);
}

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

function onKeydown(event: any) {
  emit('keydown', event);
}

defineExpose({ popupRef });
</script>

<template>
  <template v-if="shouldRender">
    <Overlay
      v-if="overlay"
      :show="show"
      :z-index="zIndexNum - 1"
      :duration="durationSec"
      :custom-style="overlayStyle"
      v-bind="overlayProps"
      @click="onClickOverlay"
    >
      <slot name="overlay-content" />
    </Overlay>
    <view
      ref="popupRef"
      :style="popupStyle"
      @tap="onClick"
      @keydown="onKeydown"
    >
      <view
        v-if="closeable"
        :style="closeIconStyle"
        @tap.stop="onClickCloseIcon"
      >
        <Icon :name="closeIcon" :size="closeIconSize" :color="closeIconColor" />
      </view>
      <slot />
    </view>
  </template>
</template>
