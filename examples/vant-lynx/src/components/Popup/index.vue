<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - lockScroll: accepted for API compat but no document.body scroll in Lynx
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - keydown: accepted for API compat but no keyboard events in Lynx
  - v-show: Lynx may not support v-show; uses v-if with CSS opacity/transform transitions
  - safeAreaInsetTop/Bottom: uses env(safe-area-inset-*); support depends on Lynx host
  - overflow-y: auto ignored in Lynx; use <scroll-view> for scrollable popup content
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import Overlay from '../Overlay/index.vue';
import Icon from '../Icon/index.vue';
import { useLazyRender } from '../../composables/useLazyRender';
import { useGlobalZIndex } from '../../composables/useGlobalZIndex';
import type {
  PopupPosition,
  PopupCloseIconPosition,
  Interceptor,
} from './types';
import './index.less';

const [, bem] = createNamespace('popup');

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
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
  'click-close-icon': [event: any];
  keydown: [event: any];
}>();

const popupRef = ref();
let opened = false;
const zIndex = ref<number>();
const internalVisible = ref(false);

// Lazy render: track if popup has ever been shown
const lazyInited = useLazyRender(() => props.show);

const shouldRender = computed(() => {
  if (props.lazyRender && !lazyInited.value) return false;
  return true;
});

// --- Duration ---

const durationSec = computed(() => {
  if (isDef(props.duration)) return Number(props.duration);
  return 0.3;
});

const durationMs = computed(() => Math.round(durationSec.value * 1000));

// --- Z-index ---

const globalZIndex = useGlobalZIndex();

// --- Open / Close ---

const open = () => {
  if (!opened) {
    opened = true;
    internalVisible.value = true;
    zIndex.value =
      props.zIndex !== undefined
        ? Number(props.zIndex)
        : globalZIndex.value;
    emit('open');
    // opened fires after enter animation
    if (durationMs.value > 0) {
      setTimeout(() => emit('opened'), durationMs.value);
    } else {
      emit('opened');
    }
  }
};

function callInterceptor(
  interceptor: Interceptor | undefined,
  done: () => void,
) {
  if (!interceptor) {
    done();
    return;
  }
  const result = interceptor();
  if (result && typeof (result as any).then === 'function') {
    (result as Promise<boolean | void>)
      .then((val) => {
        if (val !== false) done();
      })
      .catch(() => {});
  } else if (result !== false) {
    done();
  }
}

function scheduleLeave() {
  if (durationMs.value > 0) {
    setTimeout(() => {
      if (props.destroyOnClose) {
        internalVisible.value = false;
      }
      emit('closed');
    }, durationMs.value);
  } else {
    if (props.destroyOnClose) {
      internalVisible.value = false;
    }
    emit('closed');
  }
}

const close = () => {
  if (opened) {
    callInterceptor(props.beforeClose, () => {
      opened = false;
      emit('close');
      emit('update:show', false);
      scheduleLeave();
    });
  }
};

// --- Events ---

const onClickOverlay = (event: any) => {
  emit('click-overlay', event);
  if (props.closeOnClickOverlay) {
    close();
  }
};

const onClickCloseIcon = (event: any) => {
  emit('click-close-icon', event);
  close();
};

// --- Computed styles & classes ---

// Off-screen transforms for slide positions
const slideTransforms: Record<string, string> = {
  top: 'translate3d(0, -100%, 0)',
  bottom: 'translate3d(0, 100%, 0)',
  left: 'translate3d(-100%, -50%, 0)',
  right: 'translate3d(100%, -50%, 0)',
};

const popupStyle = computed(() => {
  const style: Record<string, any> = {};

  if (isDef(zIndex.value)) {
    style.zIndex = zIndex.value;
  }

  const dur = `${durationSec.value}s`;

  if (!props.position || props.position === 'center') {
    // Fade animation for center
    style.transitionProperty = 'opacity';
    style.transitionDuration = dur;
    style.opacity = props.show ? 1 : 0;
  } else {
    // Slide animation for positions
    style.transitionProperty = 'transform';
    style.transitionDuration = dur;
    if (!props.show) {
      style.transform = slideTransforms[props.position];
    }
  }

  if (!props.show) {
    style.pointerEvents = 'none';
  }

  return style;
});

const popupClasses = computed(() => [
  bem([props.position, { round: !!props.round }]),
  {
    'van-safe-area-top': !!props.safeAreaInsetTop,
    'van-safe-area-bottom': !!props.safeAreaInsetBottom,
  },
]);

const closeIconClass = computed(() =>
  bem('close-icon', { [props.closeIconPosition]: true }),
);

const overlayDuration = computed(() =>
  isDef(props.duration) ? Number(props.duration) : undefined,
);

// --- Watch ---

watch(
  () => props.show,
  (show) => {
    if (show && !opened) {
      open();
    }
    if (!show && opened) {
      opened = false;
      emit('close');
      scheduleLeave();
    }
  },
);

// Handle initially shown
if (props.show) {
  open();
}

defineExpose({ popupRef });
</script>

<template>
  <template v-if="shouldRender">
    <Overlay
      v-if="overlay"
      v-bind="overlayProps"
      :show="show"
      :z-index="zIndex"
      :duration="overlayDuration"
      :custom-style="overlayStyle"
      :class-name="overlayClass"
      @click="onClickOverlay"
    >
      <slot name="overlay-content" />
    </Overlay>
    <view
      v-if="internalVisible"
      ref="popupRef"
      :class="popupClasses"
      :style="popupStyle"
    >
      <slot />
      <view
        v-if="closeable"
        :class="closeIconClass"
        @tap.stop="onClickCloseIcon"
      >
        <Icon :name="closeIcon" :class-prefix="iconPrefix" />
      </view>
    </view>
  </template>
</template>
