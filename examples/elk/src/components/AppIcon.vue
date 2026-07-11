<script setup lang="ts">
// Lynx replacement for Elk's UnoCSS icon classes (i-ri:*): a static SVG
// data-URI in an <image>. Color must be explicit — no currentColor.
import { computed } from 'vue-lynx';
import { iconSrc } from '../composables/icons';

const props = withDefaults(defineProps<{
  name: string;
  size?: number;
  color?: string;
}>(), {
  size: 20,
  color: '#686868',
});

const src = computed(() => iconSrc(props.name, props.color));
</script>

<template>
  <image
    :src="src"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>
