<!--
  Lynx Limitations:
  - lockScroll: accepted for API compat but no document.body scroll lock in Lynx
  - teleport: accepted for API compat but Lynx has no Teleport support
  - white-space: pre-wrap not supported in Lynx (text wrapping handled by <text>)
  - word-wrap: break-word not supported in Lynx
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import { useGlobalZIndex } from '../../composables/useGlobalZIndex';
import type { NotifyType, NotifyPosition } from './types';
import './index.less';

const [, bem] = createNamespace('notify');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    type?: NotifyType;
    color?: string;
    message?: string | number;
    position?: NotifyPosition;
    className?: unknown;
    background?: string;
    lockScroll?: boolean;
    zIndex?: number | string;
    duration?: number | string;
    teleport?: string | object;
  }>(),
  {
    show: false,
    type: 'danger',
    message: '',
    position: 'top',
    lockScroll: false,
    duration: 0.2,
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const globalZIndex = useGlobalZIndex();
const internalVisible = ref(false);
const zIndex = ref<number>();

const durationSec = computed(() => {
  if (isDef(props.duration)) return Number(props.duration);
  return 0.2;
});

// Slide transforms for top/bottom
const slideTransforms: Record<string, string> = {
  top: 'translate3d(0, -100%, 0)',
  bottom: 'translate3d(0, 100%, 0)',
};

const rootStyle = computed(() => {
  const style: Record<string, any> = {};

  if (isDef(zIndex.value)) {
    style.zIndex = zIndex.value;
  }

  const dur = `${durationSec.value}s`;
  style.transitionProperty = 'transform';
  style.transitionDuration = dur;

  if (!props.show) {
    style.transform = slideTransforms[props.position] || slideTransforms.top;
    style.pointerEvents = 'none';
  }

  // Custom color/background inline styles (like Vant's color prop pattern)
  if (props.color) {
    style.color = props.color;
  }
  if (props.background) {
    style.background = props.background;
  }

  return style;
});

const rootClasses = computed(() => {
  const classes = [bem([props.type, props.position])];
  if (props.className) {
    if (typeof props.className === 'string') {
      classes.push(props.className);
    } else if (Array.isArray(props.className)) {
      classes.push(...(props.className as string[]));
    }
  }
  return classes.join(' ');
});

let opened = false;

function open() {
  if (!opened) {
    opened = true;
    internalVisible.value = true;
    zIndex.value =
      props.zIndex !== undefined
        ? Number(props.zIndex)
        : globalZIndex.value;
  }
}

function scheduleLeave() {
  const ms = Math.round(durationSec.value * 1000);
  if (ms > 0) {
    setTimeout(() => {
      internalVisible.value = false;
    }, ms);
  } else {
    internalVisible.value = false;
  }
}

watch(
  () => props.show,
  (show) => {
    if (show && !opened) {
      open();
    }
    if (!show && opened) {
      opened = false;
      scheduleLeave();
    }
  },
);

if (props.show) {
  open();
}
</script>

<template>
  <view
    v-if="internalVisible"
    :class="rootClasses"
    :style="rootStyle"
  >
    <slot>
      <text>{{ message }}</text>
    </slot>
  </view>
</template>
