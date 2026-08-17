<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - lockScroll: accepted for API compat but no direct equivalent in Lynx
  - lazyRender: accepted for API compat; v-if already provides lazy rendering
  - v-show: Lynx does not support v-show; uses v-if with opacity transition instead
  - Vue <Transition>: experimental in Lynx; uses CSS opacity transition instead
-->
<script setup lang="ts">
import { ref, computed, watch, type CSSProperties } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import './index.less';

export interface OverlayProps {
  show?: boolean;
  zIndex?: number | string;
  duration?: number | string;
  className?: string | string[] | Record<string, boolean>;
  customStyle?: CSSProperties;
  lockScroll?: boolean;
  lazyRender?: boolean;
  teleport?: string | object;
}

const props = withDefaults(defineProps<OverlayProps>(), {
  show: false,
  lockScroll: true,
  lazyRender: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const [, bem] = createNamespace('overlay');

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
  const style: Record<string, any> = {};

  if (isDef(props.zIndex)) {
    style.zIndex = Number(props.zIndex);
  }

  // Duration for fade animation
  const duration =
    typeof props.duration === 'number'
      ? `${props.duration}s`
      : props.duration ?? '0.3s';
  style.transitionProperty = 'opacity';
  style.transitionDuration = duration;

  // Fade: opacity 0 when hidden, 1 when shown
  style.opacity = props.show ? 1 : 0;

  if (!props.show) {
    style.pointerEvents = 'none';
  }

  if (props.customStyle) {
    Object.assign(style, props.customStyle);
  }

  return style;
});

const overlayClass = computed(() => {
  const classes: Array<string | Record<string, boolean>> = [bem()];
  if (props.className) {
    if (typeof props.className === 'string') {
      classes.push(props.className);
    } else if (Array.isArray(props.className)) {
      classes.push(...props.className);
    } else {
      classes.push(props.className);
    }
  }
  return classes;
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view
    v-if="shouldRender"
    :class="overlayClass"
    :style="overlayStyle"
    @tap="onTap"
  >
    <slot />
  </view>
</template>
