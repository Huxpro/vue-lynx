<script setup lang="ts">
import { computed } from 'vue-lynx';

import { useColorMode } from '../../composables/useColorMode';
import { svgFor } from '../../lib/icons';
import { resolveTone } from '../../lib/tokens';

const props = withDefaults(
  defineProps<{
    name: string;
    /** semantic tone (default/muted/dimmed/highlighted/primary/error/white/...) or a CSS color */
    tone?: string;
    size?: number;
    strokeWidth?: number;
  }>(),
  { tone: 'default', size: 20, strokeWidth: 2 },
);

const { colorMode } = useColorMode();

const content = computed(
  () => svgFor(props.name, resolveTone(props.tone, colorMode.value), props.strokeWidth) ?? '',
);

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <svg :content="content" :style="sizeStyle" class="shrink-0" />
</template>
