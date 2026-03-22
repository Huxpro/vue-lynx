<!--
  Lynx Limitations:
  - sticky positioning: no-op (Lynx lacks scroll-based DOM measurement for sticky behavior)
  - getBoundingClientRect/useRect: not available for scroll tracking
  - position: fixed anchor: not supported (no scroll-spy to trigger sticky state)
  - BORDER_BOTTOM: Vant adds bottom border when sticky, not applicable here
-->
<script setup lang="ts">
import { inject, type Ref } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { INDEX_BAR_KEY, type Numeric } from '../IndexBar/types';
import './index.less';

export interface IndexAnchorProps {
  index?: Numeric;
}

const props = defineProps<IndexAnchorProps>();

const [, bem] = createNamespace('index-anchor');

// Inject parent context for future sticky support
const _indexBar = inject<{
  props: {
    sticky: boolean;
    zIndex: Numeric | undefined;
    highlightColor: string | undefined;
    stickyOffsetTop: number;
    indexList: Numeric[];
  };
  activeAnchor: Ref<Numeric>;
}>(INDEX_BAR_KEY);
</script>

<template>
  <view :class="bem()">
    <slot>
      <text>{{ index }}</text>
    </slot>
  </view>
</template>
