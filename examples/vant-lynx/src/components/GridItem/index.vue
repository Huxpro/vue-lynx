<!--
  Lynx Limitations:
  - url/to/replace: no browser navigation or Vue Router in Lynx
  - iconPrefix: accepted for API compat but Icon uses unicode fallback
  - cursor:pointer: not applicable (Lynx is touch-only)
  - ::after pseudo-element borders: replaced with inline border styles
  - CSS class-based BEM styling: replaced with inline styles
  - role/tabindex: not applicable in Lynx
-->
<script setup lang="ts">
import { computed, inject, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import { GRID_KEY } from '../Grid/types';
import type { BadgeProps } from '../Badge/index.vue';

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}px` : String(value);
};

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

const props = withDefaults(defineProps<GridItemProps>(), {
  dot: false,
  replace: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const parent = inject(GRID_KEY)!;
const index = parent.registerChild();

const rootStyle = computed(() => {
  const { square, gutter, columnNum } = parent.props;
  const percent = `${100 / +columnNum}%`;
  const style: Record<string, any> = {
    position: 'relative',
    flexBasis: percent,
    boxSizing: 'border-box',
  };

  if (square) {
    style.height = 0;
    style.paddingTop = percent;
  } else if (gutter) {
    const gutterValue = addUnit(gutter);
    style.paddingRight = gutterValue;

    if (index >= +columnNum) {
      style.marginTop = gutterValue;
    }
  }

  return style;
});

const contentStyle = computed(() => {
  const { square, gutter, border, center, clickable, direction, reverse } = parent.props;
  const isHorizontal = direction === 'horizontal';
  const isReverse = reverse;

  let flexDir: string;
  if (isHorizontal && isReverse) {
    flexDir = 'row-reverse';
  } else if (isHorizontal) {
    flexDir = 'row';
  } else if (isReverse) {
    flexDir = 'column-reverse';
  } else {
    flexDir = 'column';
  }

  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: flexDir,
    alignItems: center ? 'center' : 'flex-start',
    justifyContent: center ? 'center' : 'flex-start',
    height: '100%',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '8px',
    paddingRight: '8px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  if (square) {
    style.position = 'absolute';
    style.top = 0;
    style.right = 0;
    style.bottom = 0;
    style.left = 0;

    if (gutter) {
      const gutterValue = addUnit(gutter);
      style.right = gutterValue;
      style.bottom = gutterValue;
      style.height = 'auto';
    }
  }

  // Border styles
  const hasGutter = !!gutter;
  if (border && !hasGutter) {
    style.borderRightWidth = 0.5;
    style.borderRightStyle = 'solid';
    style.borderRightColor = '#ebedf0';
    style.borderBottomWidth = 0.5;
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  } else if (border && hasGutter) {
    style.borderWidth = 0.5;
    style.borderStyle = 'solid';
    style.borderColor = '#ebedf0';
  }

  return style;
});

const textSpacingStyle = computed(() => {
  const isHorizontal = parent.props.direction === 'horizontal';
  const isReverse = parent.props.reverse;

  if (isHorizontal && isReverse) {
    return { marginRight: '8px' };
  } else if (isHorizontal) {
    return { marginLeft: '8px' };
  } else if (isReverse) {
    return { marginBottom: '8px' };
  }
  return { marginTop: '8px' };
});

const iconSize = computed(() => {
  const size = parent.props.iconSize;
  if (size !== undefined) return typeof size === 'number' ? size : parseFloat(size) || 28;
  return 28;
});

const textStyle: Record<string, any> = {
  fontSize: '12px',
  color: '#323233',
  lineHeight: '18px',
};

// Active state for clickable items
const isActive = ref(false);

const activeOverlayStyle: Record<string, any> = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(242,243,245,1)',
};

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
  <view :style="rootStyle">
    <view
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
        <slot name="icon">
          <Icon
            v-if="icon"
            :name="icon"
            :size="iconSize"
            :color="iconColor"
            :dot="dot"
            :badge="badge"
            :class-prefix="iconPrefix"
            :badge-props="badgeProps"
          />
        </slot>

        <slot name="text">
          <text
            v-if="text"
            :style="{ ...textStyle, ...(icon || $slots.icon ? textSpacingStyle : {}) }"
          >{{ text }}</text>
        </slot>
      </template>

      <view
        v-if="isActive && parent.props.clickable"
        :style="activeOverlayStyle"
      />
    </view>
  </view>
</template>
