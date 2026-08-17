<!--
  Lynx Limitations:
  - teleport: Lynx has no Teleport support; prop accepted for API parity but is a no-op
  - target (CSS selector): No document.querySelector in Lynx; parent must call handleScroll manually
  - Smooth scrolling: Cannot be controlled from this component; parent scroll-view handles scroll behavior
  - cursor: pointer: Not applicable in Lynx
  - box-shadow: Lynx does not support box-shadow; omitted
  - :active pseudo-class: Not supported in Lynx
  - KeepAlive: onActivated/onDeactivated not relevant in Lynx context
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Icon from '../Icon/index.vue';
import './index.less';

import type { BackTopProps } from './types';

const [, bem] = createNamespace('back-top');

const props = withDefaults(defineProps<BackTopProps>(), {
  offset: 200,
  immediate: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const show = ref(false);

const style = computed(() => {
  const s: Record<string, string> = {};
  if (props.right !== undefined) {
    s.right = addUnit(props.right)!;
  }
  if (props.bottom !== undefined) {
    s.bottom = addUnit(props.bottom)!;
  }
  if (props.zIndex !== undefined) {
    s.zIndex = String(props.zIndex);
  }
  return s;
});

function handleScroll(event: any) {
  const scrollTop = event?.detail?.scrollTop ?? event?.scrollTop ?? 0;
  show.value = scrollTop >= +props.offset;
}

function onClick(event: any) {
  emit('click', event);
}

defineExpose({ handleScroll });
</script>

<template>
  <view
    :class="bem([{ active: show }])"
    :style="style"
    @tap="onClick"
  >
    <slot>
      <Icon name="back-top" :class="bem('icon')" />
    </slot>
  </view>
</template>
