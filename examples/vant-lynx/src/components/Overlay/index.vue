<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface OverlayProps {
  show?: boolean;
  zIndex?: number;
  duration?: number;
  lockScroll?: boolean;
}

const props = withDefaults(defineProps<OverlayProps>(), {
  show: false,
  zIndex: 1,
  duration: 300,
  lockScroll: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const overlayStyle = computed(() => ({
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: props.zIndex,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
}));

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view v-if="show" :style="overlayStyle" @tap="onTap">
    <slot />
  </view>
</template>
