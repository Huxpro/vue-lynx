<!--
  Vant Feature Parity Report:
  - Component: ImagePreview
  - Props: Reviewed - see implementation for details
  - Events: Reviewed - see implementation for details
  - Slots: Reviewed - see implementation for details
  - Status: Reviewed in V2 optimization pass
-->
<!--
  Vant ImagePreview - Feature Parity Report
  ===========================================
  Vant Source: packages/vant/src/image-preview/ImagePreview.tsx

  Props:
    - show: boolean                                     [YES]
    - images: string[]                                  [YES]
    - startPosition: number (default 0)                 [YES]
    - swipeDuration: number (default 300)               [YES] (accepted, no swipe in Lynx)
    - showIndex: boolean (default true)                 [YES]
    - showIndicators: boolean                           [YES]
    - closeable: boolean                                [YES]
    - closeIcon: string (default 'clear')               [YES] uses Icon component
    - closeIconPosition: PopupCloseIconPosition         [YES]
    - loop: boolean (default true)                      [YES] added
    - minZoom / maxZoom: number                         [NO] Lynx has no pinch-zoom
    - overlay: boolean                                  [N/A] always has overlay
    - vertical: boolean                                 [NO] Lynx has no Swipe
    - className / overlayClass / overlayStyle           [NO] no CSS classes
    - transition                                        [NO] no CSS transitions
    - beforeClose: Interceptor                          [YES] added
    - doubleScale: boolean                              [NO] no touch gestures
    - closeOnPopstate: boolean                          [NO] no popstate in Lynx
    - closeOnClickImage: boolean (default true)         [YES] added
    - closeOnClickOverlay: boolean (default true)       [YES] added
    - teleport                                          [NO] Lynx has no teleport

  Events:
    - update:show                                       [YES]
    - change                                            [YES]
    - close                                             [YES]
    - closed                                            [YES] added
    - scale                                             [NO] no zoom
    - longPress                                         [NO] no long-press gesture

  Slots:
    - index                                             [YES] added
    - cover                                             [YES] added
    - image                                             [NO]

  Lynx Adaptations:
    - No Swipe component; uses manual prev/next buttons for navigation
    - No pinch-zoom or double-tap zoom (no gesture system)
    - closeIcon rendered via Icon component instead of plain text
    - Uses `display: 'flex'` explicitly on all flex containers
    - Uses Popup-like overlay pattern with fixed positioning

  Gaps:
    - No swipe gesture navigation (tap-based prev/next instead)
    - No zoom (minZoom/maxZoom/doubleScale/scale event)
    - No long-press support
    - No CSS transition animations
    - No teleport support
-->
<script setup lang="ts">
import { ref, computed, watch, useSlots } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import { useAnimate } from '../../composables/useAnimate';

export interface ImagePreviewProps {
  show?: boolean;
  images?: string[];
  startPosition?: number;
  swipeDuration?: number;
  showIndex?: boolean;
  showIndicators?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  closeIconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  loop?: boolean;
  closeOnClickImage?: boolean;
  closeOnClickOverlay?: boolean;
  beforeClose?: (active: number) => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  show: false,
  images: () => [],
  startPosition: 0,
  swipeDuration: 300,
  showIndex: true,
  showIndicators: false,
  closeable: false,
  closeIcon: 'clear',
  closeIconPosition: 'top-right',
  loop: true,
  closeOnClickImage: true,
  closeOnClickOverlay: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  change: [index: number];
  close: [info: { index: number; url: string }];
  closed: [];
}>();

const slots = useSlots();

const ANIM_DURATION = 300;
const { elRef: previewRef, fadeIn, fadeOut } = useAnimate();
const isVisible = ref(false);

const currentIndex = ref(props.startPosition);

watch(
  () => props.startPosition,
  (val) => {
    currentIndex.value = val;
  },
);

watch(
  () => props.show,
  (val) => {
    if (val) {
      currentIndex.value = props.startPosition;
      isVisible.value = true;
      fadeIn(ANIM_DURATION);
    } else if (isVisible.value) {
      fadeOut(ANIM_DURATION);
      setTimeout(() => {
        isVisible.value = false;
      }, ANIM_DURATION);
    }
  },
);

const currentImage = computed(() => {
  if (props.images.length === 0) return '';
  return props.images[currentIndex.value] || props.images[0];
});

const indexText = computed(() => {
  if (props.images.length === 0) return '';
  return `${currentIndex.value + 1} / ${props.images.length}`;
});

async function emitClose() {
  if (props.beforeClose) {
    const result = await props.beforeClose(currentIndex.value);
    if (result === false) return;
  }
  emit('close', { index: currentIndex.value, url: currentImage.value });
  emit('update:show', false);
  emit('closed');
}

function onClose() {
  emitClose();
}

function onPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    emit('change', currentIndex.value);
  } else if (props.loop && props.images.length > 1) {
    currentIndex.value = props.images.length - 1;
    emit('change', currentIndex.value);
  }
}

function onNext() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    emit('change', currentIndex.value);
  } else if (props.loop && props.images.length > 1) {
    currentIndex.value = 0;
    emit('change', currentIndex.value);
  }
}

function onTapBackground() {
  if (props.closeOnClickOverlay) {
    onClose();
  }
}

function onTapImage() {
  if (props.closeOnClickImage) {
    onClose();
  }
}

const canGoPrev = computed(() => {
  return props.loop || currentIndex.value > 0;
});

const canGoNext = computed(() => {
  return props.loop || currentIndex.value < props.images.length - 1;
});

const closeButtonStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'absolute',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  };
  const pos = props.closeIconPosition;
  if (pos.includes('top')) base.top = 0;
  if (pos.includes('bottom')) base.bottom = 0;
  if (pos.includes('left')) base.left = 0;
  if (pos.includes('right')) base.right = 0;
  return base;
});

const indicatorStyle = computed(() => (index: number) => ({
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: index === currentIndex.value ? '#fff' : 'rgba(255,255,255,0.5)',
  marginLeft: 3,
  marginRight: 3,
}));
</script>

<template>
  <view
    v-if="isVisible"
    :main-thread-ref="previewRef"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }"
    @tap="onTapBackground"
  >
    <!-- Close button using Icon component -->
    <view
      v-if="closeable"
      :style="closeButtonStyle"
      @tap.stop="onClose"
    >
      <Icon :name="closeIcon" :size="22" color="#fff" />
    </view>

    <!-- Index indicator -->
    <view
      v-if="showIndex && images.length > 0"
      :style="{
        position: 'absolute',
        top: 16,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        zIndex: 2,
      }"
    >
      <slot name="index">
        <text :style="{ fontSize: 14, color: '#fff' }">{{ indexText }}</text>
      </slot>
    </view>

    <!-- Image display area -->
    <view
      :style="{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
      }"
    >
      <!-- Prev button -->
      <view
        v-if="images.length > 1 && canGoPrev"
        :style="{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          opacity: 0.8,
        }"
        @tap.stop="onPrev"
      >
        <Icon name="arrow-left" :size="28" color="#fff" />
      </view>
      <view v-else :style="{ width: 60 }" />

      <!-- Current image -->
      <view
        :style="{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }"
        @tap.stop="onTapImage"
      >
        <image
          v-if="currentImage"
          :src="currentImage"
          :style="{ width: 300, height: 300, objectFit: 'contain' }"
        />
      </view>

      <!-- Next button -->
      <view
        v-if="images.length > 1 && canGoNext"
        :style="{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          opacity: 0.8,
        }"
        @tap.stop="onNext"
      >
        <Icon name="arrow" :size="28" color="#fff" />
      </view>
      <view v-else :style="{ width: 60 }" />
    </view>

    <!-- Cover slot -->
    <slot name="cover" />

    <!-- Dot indicators -->
    <view
      v-if="showIndicators && images.length > 1"
      :style="{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }"
    >
      <view
        v-for="(_, index) in images"
        :key="index"
        :style="indicatorStyle(index)"
        @tap.stop="() => { currentIndex = index; emit('change', index); }"
      />
    </view>
  </view>
</template>
