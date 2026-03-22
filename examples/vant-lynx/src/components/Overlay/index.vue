<!--
  Lynx Limitations:
  - teleport: accepted for API compat but not applicable in Lynx (no DOM)
  - lockScroll: accepted for API compat but no direct equivalent in Lynx
  - className: accepted but not applied as CSS class (Lynx has no CSS class system)
  - Vue <Transition>: not supported in Lynx; fade effect uses inline CSS opacity transition
  - lazyRender: uses v-if for initial render gating (no v-show in Lynx, uses opacity instead)
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';

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

// Lazy render: track if overlay has ever been shown
const hasRendered = ref(false);

watch(
  () => props.show,
  (val) => {
    if (val) hasRendered.value = true;
  },
  { immediate: true },
);

const shouldRender = computed(() => {
  if (!props.lazyRender) return true;
  return hasRendered.value;
});

const overlayStyle = computed(() => {
  const duration =
    typeof props.duration === 'number'
      ? `${props.duration}s`
      : props.duration;

  const style: Record<string, any> = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: Number(props.zIndex),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    opacity: props.show ? 1 : 0,
    transitionProperty: 'opacity',
    transitionDuration: duration,
  };

  if (!props.show) {
    // When hidden, make it non-interactive
    style.pointerEvents = 'none';
  }

  if (props.customStyle) {
    Object.assign(style, props.customStyle);
  }

  return style;
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view v-if="shouldRender" :style="overlayStyle" @tap="onTap">
    <slot />
  </view>
</template>
