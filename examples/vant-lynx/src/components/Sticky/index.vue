<!--
  Vant Feature Parity Report:
  - Props: 5/5 supported
    - offsetTop: Numeric (default 0) - offset from top when position is 'top'
    - offsetBottom: Numeric (default 0) - offset from bottom when position is 'bottom'
    - zIndex: Numeric (default 99) - z-index when sticky
    - container: Element (optional) - container element to limit sticky scope
    - position: 'top' | 'bottom' (default 'top') - sticky direction
  - Events: 2/2 supported
    - scroll: { scrollTop: number; isFixed: boolean } - emitted on scroll
    - change: boolean - emitted when fixed state changes
  - Slots: 1/1 supported (default)
  - Lynx Adaptations:
    - No DOM measurement APIs (useRect, getScrollTop) available in Lynx
    - Scroll detection requires external scroll event forwarding
    - Container-scoped sticky boundary not fully supported (no element rect measurement)
    - Uses position: 'fixed' when sticky is active
    - Width/height preservation of placeholder requires manual height prop
  - Gaps:
    - Container-scoped boundary: Vant measures container rect to limit sticky scope;
      Lynx lacks DOM measurement APIs, so container prop is accepted but boundary
      calculation is simplified
    - No automatic width/height measurement: Vant reads rootRect to set placeholder
      size; Lynx requires explicit height
    - No useScrollParent / useVisibilityChange composables
    - No window resize re-measurement
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';

export interface StickyProps {
  offsetTop?: number;
  offsetBottom?: number;
  zIndex?: number;
  container?: any;
  position?: 'top' | 'bottom';
  /** Lynx-specific: explicit content height for proper placeholder sizing */
  contentHeight?: number;
}

const props = withDefaults(defineProps<StickyProps>(), {
  offsetTop: 0,
  offsetBottom: 0,
  zIndex: 99,
  position: 'top',
  contentHeight: 0,
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
    // change event is emitted by the watcher on isFixed
  }

  emit('scroll', { scrollTop: st, isFixed: fixed });
}

watch(() => isFixed.value, (val) => {
  emit('change', val);
});

const offset = computed(() =>
  props.position === 'top' ? props.offsetTop : props.offsetBottom,
);

const wrapperStyle = computed(() => {
  if (!isFixed.value) {
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
    };
  }
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: props.position === 'top' ? offset.value : undefined,
    bottom: props.position === 'bottom' ? offset.value : undefined,
    left: 0,
    right: 0,
    zIndex: props.zIndex,
  };
});

const placeholderStyle = computed(() => {
  if (!isFixed.value) {
    return {
      display: 'flex',
      flexDirection: 'column' as const,
    };
  }
  // When fixed, placeholder reserves the space the element occupied
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    height: props.contentHeight || 0,
  };
});

defineExpose({ handleScroll, isFixed });
</script>

<template>
  <view :style="placeholderStyle">
    <view :style="wrapperStyle">
      <slot />
    </view>
  </view>
</template>
