<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

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
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  show: false,
  images: () => [],
  startPosition: 0,
  swipeDuration: 300,
  showIndex: true,
  showIndicators: false,
  closeable: false,
  closeIcon: 'X',
  closeIconPosition: 'top-right',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  change: [index: number];
  close: [info: { index: number; url: string }];
  scale: [info: { index: number; scale: number }];
}>();

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

function onClose() {
  emit('close', { index: currentIndex.value, url: currentImage.value });
  emit('update:show', false);
}

function onPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    emit('change', currentIndex.value);
  }
}

function onNext() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    emit('change', currentIndex.value);
  }
}

function onTapBackground() {
  onClose();
}

const closeButtonStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'absolute',
    fontSize: 20,
    color: '#fff',
    padding: 12,
    zIndex: 2,
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
    v-if="show"
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
    <!-- Close button -->
    <text
      v-if="closeable"
      :style="closeButtonStyle"
      @tap.stop="onClose"
    >{{ closeIcon }}</text>

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
      <text :style="{ fontSize: 14, color: '#fff' }">{{ indexText }}</text>
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
      <text
        v-if="images.length > 1 && currentIndex > 0"
        :style="{ fontSize: 28, color: '#fff', padding: 16, opacity: 0.8 }"
        @tap.stop="onPrev"
      >&lt;</text>
      <view v-else :style="{ width: 60 }" />

      <!-- Current image -->
      <view :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <image
          v-if="currentImage"
          :src="currentImage"
          :style="{ width: 300, height: 300, objectFit: 'contain' }"
        />
      </view>

      <!-- Next button -->
      <text
        v-if="images.length > 1 && currentIndex < images.length - 1"
        :style="{ fontSize: 28, color: '#fff', padding: 16, opacity: 0.8 }"
        @tap.stop="onNext"
      >&gt;</text>
      <view v-else :style="{ width: 60 }" />
    </view>

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
