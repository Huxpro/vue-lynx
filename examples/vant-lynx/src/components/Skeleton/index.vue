<!--
  Lynx Limitations:
  - <h3>/<div> HTML elements: replaced with <view> (Lynx has no HTML tags)
  - inheritAttrs: not relevant in Lynx element system
  - :not(:first-child) CSS selector: Lynx may not support :not pseudo-selector,
    paragraph margin-top is handled via CSS class rules
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import type { Numeric } from '../../utils';
import SkeletonTitle from './SkeletonTitle.vue';
import SkeletonAvatar from './SkeletonAvatar.vue';
import SkeletonParagraph from './SkeletonParagraph.vue';
import type { SkeletonProps, SkeletonAvatarShape } from './types';
import './index.less';

const DEFAULT_ROW_WIDTH = '100%';
const DEFAULT_LAST_ROW_WIDTH = '60%';

const [, bem] = createNamespace('skeleton');

const props = withDefaults(defineProps<SkeletonProps>(), {
  row: 0,
  rowWidth: DEFAULT_ROW_WIDTH,
  round: false,
  title: false,
  avatarShape: 'round',
  loading: true,
  animate: true,
});

const slots = useSlots();

const skeletonClass = computed(() =>
  bem([{ animate: props.animate, round: props.round }]),
);

const contentClass = bem('content');

function getRowWidth(index: number): string | undefined {
  const { rowWidth } = props;

  if (rowWidth === DEFAULT_ROW_WIDTH && index === +props.row - 1) {
    return DEFAULT_LAST_ROW_WIDTH;
  }

  if (Array.isArray(rowWidth)) {
    return addUnit(rowWidth[index]);
  }

  return addUnit(rowWidth as Numeric);
}

const rows = computed(() => {
  return Array(+props.row)
    .fill('')
    .map((_, i) => i);
});
</script>

<template>
  <slot v-if="!loading" />
  <view v-else :class="skeletonClass">
    <!-- Template slot replaces everything -->
    <slot name="template">
      <!-- Avatar -->
      <SkeletonAvatar
        v-if="avatar"
        :avatar-shape="avatarShape"
        :avatar-size="avatarSize"
      />

      <!-- Content -->
      <view :class="contentClass">
        <!-- Title -->
        <SkeletonTitle
          v-if="title"
          :round="round"
          :title-width="titleWidth"
        />

        <!-- Rows -->
        <SkeletonParagraph
          v-for="index in rows"
          :key="index"
          :round="round"
          :row-width="getRowWidth(index)"
        />
      </view>
    </slot>
  </view>
</template>
