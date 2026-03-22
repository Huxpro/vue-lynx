<!--
  Lynx Limitations:
  - BORDER_TOP_BOTTOM: Lynx has no ::after pseudo-elements, uses border-top/border-bottom instead
  - useScopeId: not applicable in Lynx
  - inheritAttrs: not applicable since Lynx uses view elements
  - tag: always renders as view (Lynx has no HTML tags)
-->
<script setup lang="ts">
import { createNamespace } from '../../utils/create';
import type { CellGroupProps } from './types';
import './index.less';

const props = withDefaults(defineProps<CellGroupProps>(), {
  inset: false,
  border: true,
});

const [, bem] = createNamespace('cell-group');
</script>

<template>
  <view v-if="$slots.title || title" :class="bem('title', { inset })">
    <slot name="title">
      <text>{{ title }}</text>
    </slot>
  </view>
  <view
    :class="[
      bem([{ inset }]),
      { 'van-hairline--top-bottom': border && !inset },
    ]"
  >
    <slot />
  </view>
</template>
