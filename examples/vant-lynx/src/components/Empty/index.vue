<!--
  Lynx Limitations:
  - Inline SVG: Lynx <svg> uses content/src attributes, not inline SVG children.
    Preset images (default, error, network, search) use text placeholders instead of Vant's inline SVGs.
  - <p> element: replaced with <text> for description
  - <div> element: replaced with <view>
  - <img> element: replaced with <image> for custom URLs
  - Dark theme: no .van-theme-dark class support in Lynx
-->
<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import type { Numeric } from './types';
import './index.less';

const [name, bem] = createNamespace('empty');

export interface EmptyProps {
  image?: string;
  imageSize?: Numeric | [Numeric, Numeric];
  description?: string;
}

const props = withDefaults(defineProps<EmptyProps>(), {
  image: 'default',
});

const slots = useSlots();

function getSizeStyle(
  size: Numeric | [Numeric, Numeric] | undefined,
): Record<string, string> | undefined {
  if (size === undefined) return undefined;
  if (Array.isArray(size)) {
    return {
      width: addUnit(size[0]) || '',
      height: addUnit(size[1]) || '',
    };
  }
  const s = addUnit(size);
  return s ? { width: s, height: s } : undefined;
}

const PRESET_IMAGES: Record<string, string> = {
  default: '\u{1F4ED}',
  error: '\u{26A0}\u{FE0F}',
  network: '\u{1F310}',
  search: '\u{1F50D}',
};

const isPresetImage = computed(() => props.image in PRESET_IMAGES);

const imageStyle = computed(() => getSizeStyle(props.imageSize));
</script>

<template>
  <view :class="bem()">
    <view :class="bem('image')" :style="imageStyle">
      <slot name="image">
        <image
          v-if="!isPresetImage"
          :src="image"
        />
        <text v-else>{{ PRESET_IMAGES[image] }}</text>
      </slot>
    </view>

    <slot name="description">
      <text v-if="description" :class="bem('description')">{{ description }}</text>
    </slot>

    <view v-if="$slots.default" :class="bem('bottom')">
      <slot />
    </view>
  </view>
</template>
