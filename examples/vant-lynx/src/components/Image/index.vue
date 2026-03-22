<!--
  Lynx Limitations:
  - alt: accepted for API compat but Lynx <image> has no alt text
  - position (object-position): accepted for API compat but not supported in Lynx
  - crossorigin/referrerpolicy/decoding: accepted for API compat, HTML-only attributes
  - lazyLoad: accepted but no IntersectionObserver / $Lazyload plugin in Lynx
  - iconPrefix: accepted for API compat but icons use unicode fallback
  - block: accepted but Lynx views are block by default
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { ImageFit, ImagePosition } from './types';

interface ImageProps {
  src?: string;
  fit?: ImageFit;
  position?: ImagePosition;
  alt?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  round?: boolean;
  block?: boolean;
  lazyLoad?: boolean;
  showError?: boolean;
  showLoading?: boolean;
  errorIcon?: string;
  loadingIcon?: string;
  iconSize?: string | number;
  iconPrefix?: string;
  crossorigin?: string;
  referrerpolicy?: string;
  decoding?: string;
}

const props = withDefaults(defineProps<ImageProps>(), {
  fit: 'fill',
  position: 'center',
  round: false,
  block: false,
  lazyLoad: false,
  showError: true,
  showLoading: true,
  errorIcon: 'photo-fail',
  loadingIcon: 'photo',
  iconPrefix: 'van-icon',
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
}>();

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) return `${value}px`;
  return String(value);
};

const loading = ref(true);
const error = ref(false);

watch(
  () => props.src,
  () => {
    error.value = false;
    loading.value = true;
  },
);

const containerStyle = computed(() => {
  const style: Record<string, any> = {
    overflow: 'hidden',
  };

  if (props.width !== undefined) style.width = addUnit(props.width);
  if (props.height !== undefined) style.height = addUnit(props.height);

  if (props.round) {
    style.borderRadius = '999px';
  } else if (props.radius !== undefined && props.radius !== 0 && props.radius !== '0') {
    style.borderRadius = addUnit(props.radius);
  }

  return style;
});

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.fit,
}));

const placeholderStyle = computed(() => ({
  position: 'absolute' as const,
  top: '0px',
  left: '0px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: '#f7f8fa',
}));

function onLoad(event: any) {
  loading.value = false;
  error.value = false;
  emit('load', event);
}

function onError(event: any) {
  loading.value = false;
  error.value = true;
  emit('error', event);
}
</script>

<template>
  <view :style="containerStyle">
    <image
      v-if="src && !error"
      :src="src"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
    />

    <!-- Loading placeholder -->
    <view v-if="loading && showLoading && !error" :style="placeholderStyle">
      <slot name="loading">
        <Icon :name="loadingIcon" :size="iconSize || '32px'" color="#dcdee0" />
      </slot>
    </view>

    <!-- Error placeholder -->
    <view v-if="error && showError" :style="placeholderStyle">
      <slot name="error">
        <Icon :name="errorIcon" :size="iconSize || '32px'" color="#dcdee0" />
      </slot>
    </view>

    <slot />
  </view>
</template>
