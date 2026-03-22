<!--
  Lynx Limitations:
  - SVG illustrations: Lynx has no SVG support, preset images use emoji/text placeholders
  - <img> element: Lynx uses <image> element for custom image URLs
  - CSS class-based BEM styling: replaced with inline styles
  - <p> element: replaced with <text>
  - Dark theme opacity: no .van-theme-dark class in Lynx
-->
<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue-lynx';
import type { Numeric } from './types';
import './index.less';

export interface EmptyProps {
  image?: string;
  imageSize?: Numeric | [Numeric, Numeric];
  description?: string;
}

const props = withDefaults(defineProps<EmptyProps>(), {
  image: 'default',
});

const slots = useSlots();

function addUnit(value: Numeric | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    return `${value}px`;
  }
  return String(value);
}

function getSizeStyle(
  size: Numeric | [Numeric, Numeric] | undefined,
): Record<string, string> {
  if (size === undefined) return {};
  if (Array.isArray(size)) {
    return {
      width: addUnit(size[0]),
      height: addUnit(size[1]),
    };
  }
  return {
    width: addUnit(size),
    height: addUnit(size),
  };
}

const PRESET_ICONS: Record<string, string> = {
  default: '\u{1F4ED}', // 📭
  error: '\u{26A0}\u{FE0F}', // ⚠️
  network: '\u{1F310}', // 🌐
  search: '\u{1F50D}', // 🔍
};

const isPresetImage = computed(
  () => props.image in PRESET_ICONS,
);

const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '32px',
  paddingBottom: '32px',
};

const imageContainerStyle = computed(() => ({
  width: '160px',
  height: '160px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  ...getSizeStyle(props.imageSize),
}));

const iconTextStyle = computed(() => {
  const size = props.imageSize;
  const baseSize = Array.isArray(size)
    ? +size[0]
    : size !== undefined
      ? +size
      : 160;
  return {
    fontSize: `${Math.max(baseSize * 0.4, 20)}px`,
    color: '#dcdee0',
    textAlign: 'center' as const,
  };
});

const descriptionStyle = {
  marginTop: '16px',
  paddingLeft: '60px',
  paddingRight: '60px',
  color: '#969799',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
};

const bottomStyle = {
  marginTop: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
</script>

<template>
  <view :style="containerStyle">
    <!-- Image area -->
    <view :style="imageContainerStyle">
      <slot name="image">
        <image
          v-if="!isPresetImage"
          :src="image"
          :style="{ width: '100%', height: '100%' }"
        />
        <text v-else :style="iconTextStyle">{{ PRESET_ICONS[image] }}</text>
      </slot>
    </view>

    <!-- Description -->
    <slot name="description">
      <text v-if="description" :style="descriptionStyle">{{ description }}</text>
    </slot>

    <!-- Bottom content -->
    <view v-if="$slots.default" :style="bottomStyle">
      <slot />
    </view>
  </view>
</template>
