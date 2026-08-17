<!--
  Lynx Limitations:
  - alt: accepted for API compat but Lynx <image> has no alt text rendering
  - position (object-position): accepted for API compat but not supported in Lynx
  - crossorigin/referrerpolicy/decoding: accepted for API compat, HTML-only attributes
  - lazyLoad: accepted but no IntersectionObserver / $Lazyload plugin in Lynx
  - block: accepted but Lynx views are block by default (display: inline-block N/A)
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit, isDef } from '../../utils/format';
import Icon from '../Icon/index.vue';
import type { ImageFit, ImagePosition } from './types';

import './index.less';

const [name, bem] = createNamespace('image');

interface ImageProps {
  src?: string;
  alt?: string;
  fit?: ImageFit;
  position?: ImagePosition;
  round?: boolean;
  block?: boolean;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  lazyLoad?: boolean;
  iconSize?: string | number;
  showError?: boolean;
  errorIcon?: string;
  iconPrefix?: string;
  showLoading?: boolean;
  loadingIcon?: string;
  crossorigin?: string;
  referrerpolicy?: string;
  decoding?: string;
}

const props = withDefaults(defineProps<ImageProps>(), {
  round: false,
  block: false,
  lazyLoad: false,
  showError: true,
  showLoading: true,
  errorIcon: 'photo-fail',
  loadingIcon: 'photo',
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
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

const rootClass = computed(() => {
  return bem([{ round: props.round }]);
});

const rootStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.width !== undefined) {
    const w = addUnit(props.width);
    if (w) style.width = w;
  }
  if (props.height !== undefined) {
    const h = addUnit(props.height);
    if (h) style.height = h;
  }

  if (isDef(props.radius)) {
    style.borderRadius = addUnit(props.radius)!;
  }

  return style;
});

const imageStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.fit) {
    style.objectFit = props.fit;
  }
  return style;
});

function onLoad(event: any) {
  if (loading.value) {
    loading.value = false;
    emit('load', event);
  }
}

function onError(event: any) {
  error.value = true;
  loading.value = false;
  emit('error', event);
}
</script>

<template>
  <view :class="rootClass" :style="rootStyle">
    <image
      v-if="src && !error"
      :src="src"
      :class="bem('img')"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
    />

    <!-- Loading placeholder -->
    <view v-if="loading && showLoading" :class="bem('loading')">
      <slot name="loading">
        <Icon
          :name="loadingIcon"
          :size="iconSize"
          :class="bem('loading-icon')"
          :classPrefix="iconPrefix"
        />
      </slot>
    </view>

    <!-- Error placeholder -->
    <view v-if="error && showError" :class="bem('error')">
      <slot name="error">
        <Icon
          :name="errorIcon"
          :size="iconSize"
          :class="bem('error-icon')"
          :classPrefix="iconPrefix"
        />
      </slot>
    </view>

    <slot />
  </view>
</template>
