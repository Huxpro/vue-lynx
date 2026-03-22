<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - className: applied as additional class on root, but complex selectors may not work
  - overlayClass: passed to Popup's overlay, Lynx CSS selector limitations apply
  - window resize: no window.innerWidth/Height; rootWidth/Height use fixed defaults
  - pinch-zoom: Two-finger gestures may not work in all Lynx hosts
  - image slot video: Lynx has no <video> element
-->
<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import Popup from '../Popup/index.vue';
import Swipe from '../Swipe/index.vue';
import ImagePreviewItem from './ImagePreviewItem.vue';
import type {
  Interceptor,
  PopupCloseIconPosition,
  ImagePreviewScaleEventParams,
} from './types';
import './index.less';

const [name, bem] = createNamespace('image-preview');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    images?: string[];
    loop?: boolean;
    minZoom?: number | string;
    maxZoom?: number | string;
    overlay?: boolean;
    vertical?: boolean;
    closeable?: boolean;
    showIndex?: boolean;
    className?: string | string[] | Record<string, boolean>;
    closeIcon?: string;
    transition?: string;
    beforeClose?: Interceptor;
    doubleScale?: boolean;
    overlayClass?: string | string[] | Record<string, boolean>;
    overlayStyle?: Record<string, any>;
    swipeDuration?: number | string;
    startPosition?: number | string;
    showIndicators?: boolean;
    closeOnPopstate?: boolean;
    closeOnClickImage?: boolean;
    closeOnClickOverlay?: boolean;
    closeIconPosition?: PopupCloseIconPosition;
    teleport?: string | object;
  }>(),
  {
    show: false,
    images: () => [],
    loop: true,
    minZoom: 1 / 3,
    maxZoom: 3,
    overlay: true,
    vertical: false,
    closeable: false,
    showIndex: true,
    closeIcon: 'clear',
    doubleScale: true,
    swipeDuration: 300,
    startPosition: 0,
    showIndicators: false,
    closeOnPopstate: true,
    closeOnClickImage: true,
    closeOnClickOverlay: true,
    closeIconPosition: 'top-right',
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  scale: [params: ImagePreviewScaleEventParams];
  close: [info: { index: number; url: string }];
  closed: [];
  change: [index: number];
  longPress: [info: { index: number }];
}>();

const slots = useSlots();

const swipeRef = ref<InstanceType<typeof Swipe>>();
const activeItemRef = ref<InstanceType<typeof ImagePreviewItem>>();

const state = reactive({
  active: +props.startPosition,
  rootWidth: 375,
  rootHeight: 667,
  disableZoom: false,
});

function callInterceptor(
  interceptor: Interceptor | undefined,
  done: () => void,
) {
  if (!interceptor) {
    done();
    return;
  }
  const result = interceptor(state.active);
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

const updateShow = (show: boolean) => emit('update:show', show);

const emitClose = () => {
  callInterceptor(props.beforeClose, () => updateShow(false));
};

const emitScale = (args: ImagePreviewScaleEventParams) =>
  emit('scale', args);

const setActive = (active: number) => {
  if (active !== state.active) {
    state.active = active;
    emit('change', active);
  }
};

const onDragStart = () => {
  state.disableZoom = true;
};

const onDragEnd = () => {
  state.disableZoom = false;
};

const onClosed = () => emit('closed');

const onPopupUpdateShow = (show: boolean) => {
  // Popup controls show via its own internal close mechanism
  updateShow(show);
};

// --- Exposed methods ---

function swipeTo(index: number, options?: { immediate?: boolean }) {
  (swipeRef.value as any)?.swipeTo?.(index, options);
}

function resetScale() {
  (activeItemRef.value as any)?.resetScale?.();
}

defineExpose({ resetScale, swipeTo });

// --- Watchers ---

watch(
  () => props.startPosition,
  (value) => setActive(+value),
);

watch(
  () => props.show,
  (value) => {
    if (value) {
      setActive(+props.startPosition);
      nextTick(() => {
        swipeTo(+props.startPosition, { immediate: true });
      });
    } else {
      emit('close', {
        index: state.active,
        url: props.images[state.active],
      });
    }
  },
);

const popupClass = computed(() => {
  const classes: any[] = [bem()];
  if (props.className) classes.push(props.className);
  return classes;
});

const overlayClassList = computed(() => {
  const classes: any[] = [bem('overlay')];
  if (props.overlayClass) classes.push(props.overlayClass);
  return classes;
});
</script>

<template>
  <Popup
    :show="show"
    :class="popupClass"
    :overlay="overlay"
    :overlay-class="overlayClassList"
    :overlay-style="overlayStyle"
    :close-on-click-overlay="false"
    :close-on-popstate="closeOnPopstate"
    :transition="transition"
    @closed="onClosed"
    @update:show="onPopupUpdateShow"
  >
    <!-- Close icon -->
    <view
      v-if="closeable"
      :class="bem('close-icon', { [closeIconPosition]: true })"
      @tap.stop="emitClose"
    >
      <Icon :name="closeIcon" />
    </view>

    <!-- Swipe container -->
    <Swipe
      ref="swipeRef"
      lazy-render
      :loop="loop"
      :class="bem('swipe')"
      :vertical="vertical"
      :duration="swipeDuration"
      :initial-swipe="startPosition"
      :show-indicators="showIndicators"
      indicator-color="white"
      @change="setActive"
    >
      <ImagePreviewItem
        v-for="(image, index) in images"
        :key="index"
        :ref="(el: any) => { if (index === state.active) activeItemRef = el; }"
        :src="image"
        :show="show"
        :active="state.active"
        :max-zoom="maxZoom"
        :min-zoom="minZoom"
        :root-width="state.rootWidth"
        :root-height="state.rootHeight"
        :disable-zoom="state.disableZoom"
        :double-scale="doubleScale"
        :close-on-click-image="closeOnClickImage"
        :close-on-click-overlay="closeOnClickOverlay"
        :vertical="vertical"
        @scale="emitScale"
        @close="emitClose"
        @long-press="emit('longPress', { index })"
      >
        <template v-if="$slots.image" #image="slotProps">
          <slot name="image" v-bind="slotProps" />
        </template>
      </ImagePreviewItem>
    </Swipe>

    <!-- Index indicator -->
    <view v-if="showIndex && images.length > 0" :class="bem('index')">
      <slot name="index" :index="state.active">
        <text>{{ state.active + 1 }} / {{ images.length }}</text>
      </slot>
    </view>

    <!-- Cover slot -->
    <view v-if="$slots.cover" :class="bem('cover')">
      <slot name="cover" />
    </view>
  </Popup>
</template>
