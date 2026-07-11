<script setup lang="ts">
// Lynx replacement for Elk's UnoCSS icon classes (i-ri:*): raw SVG XML in
// the built-in <svg> element (native SVG renderer; x-svg on web). The
// earlier <image src="data:image/svg+xml"> approach rendered blank on
// native — Lynx's image loaders ship no SVG decoder. Color must be
// explicit — no currentColor.
import { computed } from 'vue-lynx';
import { iconSvg } from '../composables/icons';

const props = withDefaults(defineProps<{
  name: string;
  size?: number;
  color?: string;
}>(), {
  size: 20,
  color: '#686868',
});

const content = computed(() => iconSvg(props.name, props.color));
</script>

<template>
  <svg
    :content="content"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>
