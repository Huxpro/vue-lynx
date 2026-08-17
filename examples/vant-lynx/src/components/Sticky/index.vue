<!--
  Lynx Limitations:
  - useScrollParent: Lynx has no automatic scroll parent detection; parent must call
    handleScroll() manually to forward scroll events.
  - useRect/getBoundingClientRect: Not available in Lynx; element measurement not possible.
    Sticky behavior uses simplified scrollTop comparison instead of rect-based calculation.
  - useVisibilityChange: No IntersectionObserver for visibility-based re-calculation.
  - Container boundary: Vant measures container rect to limit sticky scope; Lynx cannot
    measure element rects, so container prop is accepted but boundary calculation is simplified.
  - Window resize re-measurement: No window resize event in Lynx.
  - Width/height placeholder: Vant reads rootRect to set placeholder size; Lynx cannot
    measure element dimensions automatically.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { addUnit } from '../../utils/format';
import type { Numeric } from '../../utils/format';
import './index.less';

export type StickyPosition = 'top' | 'bottom';

const [name, bem] = createNamespace('sticky');

interface StickyProps {
  zIndex?: Numeric;
  position?: StickyPosition;
  container?: object;
  offsetTop?: Numeric;
  offsetBottom?: Numeric;
}

const props = withDefaults(defineProps<StickyProps>(), {
  position: 'top',
  offsetTop: 0,
  offsetBottom: 0,
});

const emit = defineEmits<{
  scroll: [params: { scrollTop: number; isFixed: boolean }];
  change: [isFixed: boolean];
}>();

const isFixed = ref(false);
const transform = ref(0);

const offset = computed(() => {
  const val = props.position === 'top' ? props.offsetTop : props.offsetBottom;
  if (typeof val === 'number') return val;
  return parseFloat(String(val)) || 0;
});

const rootClass = computed(() =>
  bem([{ fixed: isFixed.value }]),
);

const stickyStyle = computed(() => {
  if (!isFixed.value) return undefined;

  const style: Record<string, any> = {};

  if (props.zIndex !== undefined) {
    style.zIndex = Number(props.zIndex);
  }

  if (props.position === 'top') {
    style.top = addUnit(offset.value);
  } else {
    style.bottom = addUnit(offset.value);
  }

  style.left = 0;
  style.right = 0;

  if (transform.value) {
    style.transform = `translate3d(0, ${transform.value}px, 0)`;
  }

  return style;
});

/**
 * Lynx-specific: Called by parent scroll container to update sticky state.
 * In Vant web, this is done automatically via useScrollParent + useEventListener.
 * In Lynx, parent must call this with scroll event data.
 */
function handleScroll(event: any) {
  const st = typeof event === 'number'
    ? event
    : (event?.detail?.scrollTop ?? event?.scrollTop ?? 0);

  let fixed = false;
  if (props.position === 'top') {
    fixed = st > offset.value;
  } else {
    fixed = st > offset.value;
  }

  if (fixed !== isFixed.value) {
    isFixed.value = fixed;
  }

  transform.value = 0;
  emit('scroll', { scrollTop: st, isFixed: fixed });
}

watch(() => isFixed.value, (val) => {
  emit('change', val);
});

defineExpose({ handleScroll, isFixed });
</script>

<template>
  <view>
    <view :class="rootClass" :style="stickyStyle">
      <slot />
    </view>
  </view>
</template>
