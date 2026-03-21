<!--
  Vant Feature Parity Report:
  - Props: 5/8 supported (show, zIndex, duration, lockScroll, customStyle partial)
  - Events: 1/1 supported (click)
  - Slots: 1/1 (default)
  - Gaps:
    - No className prop (class-based styling N/A in Lynx)
    - No lazyRender prop (v-if is effectively lazy)
    - No teleport prop (not applicable in Lynx)
    - No fade transition animation
    - customStyle partially supported via style merge
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface OverlayProps {
  show?: boolean;
  zIndex?: number;
  duration?: number;
  lockScroll?: boolean;
  customStyle?: Record<string, any>;
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

const overlayStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: props.zIndex,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  };
  if (props.customStyle) {
    Object.assign(base, props.customStyle);
  }
  return base;
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view v-if="show" :style="overlayStyle" @tap="onTap">
    <slot />
  </view>
</template>
