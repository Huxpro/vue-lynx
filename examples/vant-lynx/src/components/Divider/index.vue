<!--
  Lynx Limitations:
  - ::before/::after pseudo-elements: Not supported in Lynx; uses <view> sub-elements for divider lines
  - role="separator": HTML accessibility attributes not applicable in Lynx
  - scaleY(0.5) hairline: Lynx uses 0.5px border-width instead of transform scale
  - display: inline-block: Lynx has no inline layout; vertical dividers work inside flex-row containers
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import type { DividerContentPosition } from './types';
import './index.less';

const [, bem] = createNamespace('divider');

interface DividerProps {
  dashed?: boolean;
  hairline?: boolean;
  vertical?: boolean;
  contentPosition?: DividerContentPosition;
}

const props = withDefaults(defineProps<DividerProps>(), {
  dashed: false,
  hairline: true,
  vertical: false,
  contentPosition: 'center',
});

const slots = useSlots();

const hasContent = computed(() => !!slots.default && !props.vertical);

const rootClass = computed(() =>
  bem([
    {
      dashed: props.dashed,
      hairline: props.hairline,
      vertical: props.vertical,
      [`content-${props.contentPosition}`]: hasContent.value,
    },
  ]),
);
</script>

<template>
  <view :class="rootClass">
    <view class="van-divider__line van-divider__line--left" />
    <template v-if="hasContent">
      <slot />
    </template>
    <view v-if="hasContent" class="van-divider__line van-divider__line--right" />
  </view>
</template>
