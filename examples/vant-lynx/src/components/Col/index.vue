<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
-->
<script setup lang="ts">
import { computed, inject, getCurrentInstance, onUnmounted, watch } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { ROW_KEY } from '../Row/types';
import './index.less';

export interface ColProps {
  tag?: string;
  span?: number | string;
  offset?: number | string;
}

const props = withDefaults(defineProps<ColProps>(), {
  tag: 'div',
  span: 0,
});

const [, bem] = createNamespace('col');

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

const colClass = computed(() => {
  const span = Number(props.span) || 0;
  const offset = Number(props.offset) || 0;
  return bem([{
    [String(span)]: !!span,
    [`offset-${offset}`]: !!offset,
  }]);
});

// Inline styles ONLY for dynamic gutter padding/margin (from parent Row)
const colStyle = computed(() => {
  if (!parent) return undefined;

  const index = parent.getIndex(uid);
  const { spaces, verticalSpaces } = parent;
  const style: Record<string, string> = {};

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

  return Object.keys(style).length ? style : undefined;
});
</script>

<template>
  <view :class="colClass" :style="colStyle">
    <slot />
  </view>
</template>
