<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue-lynx';

export interface StickyProps {
  offsetTop?: number;
  offsetBottom?: number;
  zIndex?: number;
  container?: any;
  position?: 'top' | 'bottom';
}

const props = withDefaults(defineProps<StickyProps>(), {
  offsetTop: 0,
  offsetBottom: 0,
  zIndex: 99,
  position: 'top',
});

const emit = defineEmits<{
  scroll: [params: { scrollTop: number; isFixed: boolean }];
  change: [isFixed: boolean];
}>();

const isFixed = ref(false);
const scrollTop = ref(0);

function handleScroll(event: any) {
  const st = event?.detail?.scrollTop ?? 0;
  scrollTop.value = st;

  let fixed = false;
  if (props.position === 'top') {
    fixed = st >= props.offsetTop;
  } else {
    fixed = st >= props.offsetBottom;
  }

  if (fixed !== isFixed.value) {
    isFixed.value = fixed;
    emit('change', fixed);
  }

  emit('scroll', { scrollTop: st, isFixed: fixed });
}

const wrapperStyle = computed(() => {
  if (!isFixed.value) {
    return {
      position: 'relative' as const,
    };
  }
  return {
    position: 'fixed' as const,
    top: props.position === 'top' ? props.offsetTop : undefined,
    bottom: props.position === 'bottom' ? props.offsetBottom : undefined,
    left: 0,
    right: 0,
    zIndex: props.zIndex,
  };
});

const placeholderStyle = computed(() => {
  if (!isFixed.value) {
    return { height: 0 };
  }
  return {
    height: 0,
  };
});
</script>

<template>
  <view :style="placeholderStyle">
    <view :style="wrapperStyle">
      <slot />
    </view>
  </view>
</template>
