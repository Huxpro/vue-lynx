<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface EmptyProps {
  image?: 'default' | 'error' | 'network' | 'search';
  imageSize?: number;
  description?: string;
}

const props = withDefaults(defineProps<EmptyProps>(), {
  image: 'default',
  imageSize: 160,
  description: '',
});

const containerStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 32,
  paddingBottom: 32,
}));

const imageContainerStyle = computed(() => ({
  width: props.imageSize,
  height: props.imageSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const iconTextStyle = computed(() => ({
  fontSize: props.imageSize * 0.4,
  color: '#dcdee0',
  textAlign: 'center' as const,
  lineHeight: props.imageSize * 0.5,
}));

const descriptionStyle = computed(() => ({
  fontSize: 14,
  color: '#969799',
  marginTop: 16,
  textAlign: 'center' as const,
  lineHeight: 20,
  paddingLeft: 32,
  paddingRight: 32,
}));

const bottomStyle = computed(() => ({
  marginTop: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const imageConfig: Record<string, { icon: string; defaultDesc: string }> = {
  default: { icon: '\u{1F4ED}', defaultDesc: 'No data' },
  error: { icon: '\u{26A0}', defaultDesc: 'Something went wrong' },
  network: { icon: '\u{1F310}', defaultDesc: 'Network error' },
  search: { icon: '\u{1F50D}', defaultDesc: 'No results found' },
};

const currentConfig = computed(() => imageConfig[props.image] || imageConfig.default);

const displayDescription = computed(() =>
  props.description || currentConfig.value.defaultDesc
);
</script>

<template>
  <view :style="containerStyle">
    <view :style="imageContainerStyle">
      <text :style="iconTextStyle">{{ currentConfig.icon }}</text>
    </view>
    <text :style="descriptionStyle">{{ displayDescription }}</text>
    <view :style="bottomStyle">
      <slot />
    </view>
  </view>
</template>
