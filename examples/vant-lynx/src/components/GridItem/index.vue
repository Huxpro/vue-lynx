<!--
  Lynx Limitations:
  - url/to/replace: no browser navigation or Vue Router in Lynx
  - cursor:pointer: not applicable (Lynx is touch-only)
  - ::after pseudo-element borders: uses direct CSS border classes instead
  - role/tabindex: not applicable in Lynx
  - :active pseudo-class: uses touchstart/touchend with --active class
-->
<script setup lang="ts">
import { computed, inject, ref, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import { GRID_KEY } from '../Grid/types';
import Icon from '../Icon/index.vue';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import './index.less';

export interface GridItemProps {
  dot?: boolean;
  text?: string;
  icon?: string;
  badge?: string | number;
  iconColor?: string;
  iconPrefix?: string;
  badgeProps?: Partial<BadgeProps>;
  url?: string;
  to?: string | Record<string, any>;
  replace?: boolean;
}

const props = defineProps<GridItemProps>();

const emit = defineEmits<{
  click: [event: any];
}>();

const slots = useSlots();

const [, bem] = createNamespace('grid-item');

const parent = inject(GRID_KEY)!;
const index = parent.registerChild();

const isActive = ref(false);

const rootClass = computed(() => {
  return bem([{ square: !!parent.props.square }]);
});

const rootStyle = computed(() => {
  const { square, gutter, columnNum } = parent.props;
  const percent = `${100 / +columnNum}%`;
  const style: Record<string, string> = {
    flexBasis: percent,
  };

  if (square) {
    style.paddingTop = percent;
  } else if (gutter) {
    const gutterValue = addUnit(gutter)!;
    style.paddingRight = gutterValue;

    if (index >= +columnNum) {
      style.marginTop = gutterValue;
    }
  }

  return style;
});

const contentClass = computed(() => {
  const { center, border, square, gutter, reverse, direction, clickable } = parent.props;
  return bem('content', [
    direction,
    {
      center: center !== false,
      square: !!square,
      reverse: !!reverse,
      clickable: !!clickable,
      surround: !!border && !!gutter,
      border: !!border && !gutter,
      active: isActive.value && !!clickable,
    },
  ]);
});

const contentStyle = computed(() => {
  const { square, gutter } = parent.props;

  if (square && gutter) {
    const gutterValue = addUnit(gutter)!;
    return {
      right: gutterValue,
      bottom: gutterValue,
      height: 'auto',
    };
  }

  return undefined;
});

function onTouchStart() {
  if (parent.props.clickable) {
    isActive.value = true;
  }
}

function onTouchEnd() {
  isActive.value = false;
}

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view :class="rootClass" :style="rootStyle">
    <view
      :class="contentClass"
      :style="contentStyle"
      @tap="onTap"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <template v-if="$slots.default">
        <slot />
      </template>

      <template v-else>
        <!-- Icon slot: wrap in Badge for dot/badge support -->
        <Badge v-if="$slots.icon" :dot="dot" :content="badge" v-bind="badgeProps || {}">
          <slot name="icon" />
        </Badge>

        <!-- Icon prop: use Icon component (has Badge internally) -->
        <Icon
          v-else-if="icon"
          :name="icon"
          :size="parent.props.iconSize"
          :color="iconColor"
          :dot="dot"
          :badge="badge"
          :badge-props="badgeProps"
          :class-prefix="iconPrefix"
          :class="bem('icon')"
        />

        <!-- Text slot or text prop -->
        <slot name="text">
          <text v-if="text" :class="bem('text')">{{ text }}</text>
        </slot>
      </template>
    </view>
  </view>
</template>
