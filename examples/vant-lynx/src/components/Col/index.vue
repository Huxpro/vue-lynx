<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
  - CSS class-based BEM styling replaced with inline styles
  - 24-column grid uses percentage-based width/margin-left via inline styles
-->
<script setup lang="ts">
import { computed, inject, getCurrentInstance, onUnmounted, watch } from 'vue-lynx';
import { ROW_KEY } from '../Row/types';

export interface ColProps {
  tag?: string;
  span?: number | string;
  offset?: number | string;
}

const props = withDefaults(defineProps<ColProps>(), {
  tag: 'div',
  span: 0,
});

const parent = inject(ROW_KEY, null);
const instance = getCurrentInstance()!;
const uid = instance.uid;

if (parent) {
  parent.register(uid, Number(props.span) || 0);
  onUnmounted(() => parent.unregister(uid));
  watch(() => props.span, (newSpan) => {
    parent.updateSpan(uid, Number(newSpan) || 0);
  });
}

const colStyle = computed(() => {
  const span = Number(props.span) || 0;
  const offset = Number(props.offset) || 0;

  const style: Record<string, string | undefined> = {};

  if (span) {
    style.width = `${(span / 24) * 100}%`;
  }

  if (offset) {
    style.marginLeft = `${(offset / 24) * 100}%`;
  }

  if (parent) {
    const index = parent.getIndex(uid);
    const { spaces, verticalSpaces } = parent;

    if (spaces.value && spaces.value[index]) {
      const { left, right } = spaces.value[index];
      if (left) {
        style.paddingLeft = `${left}px`;
      }
      if (right) {
        style.paddingRight = `${right}px`;
      }
    }

    const verticalSpace = verticalSpaces.value[index];
    if (verticalSpace?.bottom) {
      style.marginBottom = `${verticalSpace.bottom}px`;
    }
  }

  return style;
});
</script>

<template>
  <view :style="colStyle">
    <slot />
  </view>
</template>
