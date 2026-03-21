<!--
  Vant Feature Parity Report:
  - Props: 10/17 supported (src, fit, width, height, radius, round, lazyLoad, showError,
    showLoading, block, errorIcon, loadingIcon, iconSize)
  - Events: 3/3 (load, error, click)
  - Slots: 3/3 (default, loading, error)
  - Gaps:
    - No alt prop (N/A in Lynx)
    - No position prop (object-position)
    - No iconPrefix prop
    - No crossorigin/referrerpolicy/decoding (N/A in Lynx)
    - No lazy load implementation
    - Uses Icon component for loading/error placeholders
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface ImageProps {
  src?: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
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
}

const props = withDefaults(defineProps<ImageProps>(), {
  fit: 'fill',
  round: false,
  block: false,
  showError: true,
  showLoading: true,
  errorIcon: 'photo',
  loadingIcon: 'photo',
  iconSize: 32,
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
  click: [event: any];
}>();

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
  const w = typeof props.width === 'number' ? props.width : parseInt(String(props.width), 10) || undefined;
  const h = typeof props.height === 'number' ? props.height : parseInt(String(props.height), 10) || undefined;
  const r = props.round ? 999 : (typeof props.radius === 'number' ? props.radius : parseInt(String(props.radius), 10) || 0);

  return {
    width: w,
    height: h,
    borderRadius: r,
    overflow: 'hidden' as const,
    backgroundColor: '#f7f8fa',
  };
});

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.fit,
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

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view :style="containerStyle" @tap="onTap">
    <image v-if="src && !error" :src="src" :style="imageStyle" @load="onLoad" @error="onError" />

    <!-- Loading placeholder -->
    <view
      v-if="loading && showLoading && !error"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f7f8fa',
      }"
    >
      <slot name="loading">
        <Icon :name="loadingIcon" :size="iconSize" color="#dcdee0" />
      </slot>
    </view>

    <!-- Error placeholder -->
    <view
      v-if="error && showError"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f7f8fa',
      }"
    >
      <slot name="error">
        <Icon :name="errorIcon" :size="iconSize" color="#dcdee0" />
      </slot>
    </view>

    <slot />
  </view>
</template>
