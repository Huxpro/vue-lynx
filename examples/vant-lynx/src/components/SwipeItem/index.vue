<!--
  Lynx Limitations:
  - No DOM measurement: width/height inherited from parent Swipe via provide/inject
-->
<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted, nextTick } from 'vue-lynx';
import { SWIPE_KEY, type SwipeItemExpose } from '../Swipe/types';
import './index.less';

let rendered = false;
const state = ref({
  offset: 0,
  inited: false,
  mounted: false,
});

const parent = inject(SWIPE_KEY);
let index = -1;

if (parent) {
  const expose: SwipeItemExpose = {
    setOffset: (offset: number) => {
      state.value = { ...state.value, offset };
    },
  };
  index = parent.registerChild(expose);

  onUnmounted(() => {
    parent.unregisterChild(expose);
  });
}

const style = computed(() => {
  if (!parent) return {};
  const s: Record<string, string> = {};
  const vertical = parent.props.vertical;

  if (parent.size.value) {
    s[vertical ? 'height' : 'width'] = `${parent.size.value}px`;
  }

  if (state.value.offset) {
    s.transform = `translate${vertical ? 'Y' : 'X'}(${state.value.offset}px)`;
  }

  return s;
});

const shouldRender = computed(() => {
  if (!parent) return true;
  const { loop, lazyRender } = parent.props;

  if (!lazyRender || rendered) {
    return true;
  }

  if (!state.value.mounted) {
    return false;
  }

  const active = parent.activeIndicator.value;
  const maxActive = parent.count.value - 1;
  const prevActive = active === 0 && loop ? maxActive : active - 1;
  const nextActive = active === maxActive && loop ? 0 : active + 1;
  rendered =
    index === active ||
    index === prevActive ||
    index === nextActive;

  return rendered;
});

onMounted(() => {
  nextTick(() => {
    state.value = { ...state.value, mounted: true };
  });
});
</script>

<template>
  <view class="van-swipe-item" :style="style">
    <slot v-if="shouldRender" />
  </view>
</template>
