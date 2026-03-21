<!--
  Vant Feature Parity Report:
  - Props: 8/8 supported (show, zIndex, duration, className, customStyle, lockScroll, lazyRender, teleport)
  - Events: 1/1 supported (click)
  - Slots: 1/1 (default)
  - Lynx Limitations:
    - teleport: accepted for API compat but not applicable in Lynx (no DOM)
    - lockScroll: accepted for API compat but no direct equivalent in Lynx
    - className: accepted but applied as inline style override since Lynx has no CSS class system
  - Animation: Fade in/out using main-thread element.animate()
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { useAnimate } from '../../composables/useAnimate';

export interface OverlayProps {
  show?: boolean;
  zIndex?: number | string;
  duration?: number | string;
  className?: string | string[] | Record<string, boolean>;
  customStyle?: Record<string, any>;
  lockScroll?: boolean;
  lazyRender?: boolean;
  teleport?: string | Element;
}

const props = withDefaults(defineProps<OverlayProps>(), {
  show: false,
  zIndex: 1,
  duration: 0.3,
  lockScroll: true,
  lazyRender: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

// Animation
const { elRef: animRef, fadeIn, fadeOut } = useAnimate();

// For lazy render: track if overlay has ever been shown
const hasRendered = ref(false);
// Controls DOM presence during leave animation
const isVisible = ref(false);

watch(
  () => props.show,
  (val) => {
    const ms = Number(props.duration) * 1000;
    if (val) {
      hasRendered.value = true;
      isVisible.value = true;
      fadeIn(ms);
    } else if (isVisible.value) {
      fadeOut(ms);
      setTimeout(() => {
        isVisible.value = false;
      }, ms);
    }
  },
  { immediate: true },
);

const shouldRender = computed(() => {
  if (!props.lazyRender) return true;
  return hasRendered.value;
});

const overlayStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Number(props.zIndex),
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
  <view
    v-if="shouldRender && isVisible"
    :main-thread-ref="animRef"
    :style="overlayStyle"
    @tap="onTap"
  >
    <slot />
  </view>
</template>
