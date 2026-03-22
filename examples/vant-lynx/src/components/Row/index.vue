<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
  - CSS class-based BEM styling replaced with inline styles
  - Gutter distribution uses Vant's per-child padding algorithm
-->
<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue-lynx';
import { ROW_KEY, type RowAlign, type RowJustify, type RowSpaces, type VerticalSpaces } from './types';

export interface RowProps {
  tag?: string;
  wrap?: boolean;
  align?: RowAlign;
  gutter?: number | string | (number | string)[];
  justify?: RowJustify;
}

const props = withDefaults(defineProps<RowProps>(), {
  tag: 'div',
  wrap: true,
  gutter: 0,
});

// Child registration
interface ChildInfo {
  uid: number;
  span: number;
}

const children = shallowRef<ChildInfo[]>([]);

function register(uid: number, span: number) {
  children.value = [...children.value, { uid, span }];
}

function unregister(uid: number) {
  children.value = children.value.filter(c => c.uid !== uid);
}

function updateSpan(uid: number, span: number) {
  children.value = children.value.map(c =>
    c.uid === uid ? { ...c, span } : c,
  );
}

function getIndex(uid: number) {
  return children.value.findIndex(c => c.uid === uid);
}

// Vant's group algorithm: group children into rows based on 24-column grid
const groups = computed(() => {
  const result: number[][] = [[]];
  let totalSpan = 0;

  children.value.forEach((_child, index) => {
    totalSpan += Number(_child.span);
    if (totalSpan > 24) {
      result.push([index]);
      totalSpan -= 24;
    } else {
      result[result.length - 1].push(index);
    }
  });

  return result;
});

const gutterH = computed(() => {
  if (Array.isArray(props.gutter)) {
    return Number(props.gutter[0]) || 0;
  }
  return Number(props.gutter) || 0;
});

// Vant's per-child horizontal space algorithm
const spaces = computed(() => {
  const gutter = gutterH.value;
  const result: RowSpaces = [];

  if (!gutter) {
    return result;
  }

  groups.value.forEach((group) => {
    const averagePadding = (gutter * (group.length - 1)) / group.length;

    group.forEach((item, index) => {
      if (index === 0) {
        result.push({ right: averagePadding });
      } else {
        const left = gutter - result[item - 1].right;
        const right = averagePadding - left;
        result.push({ left, right });
      }
    });
  });

  return result;
});

// Vant's vertical space algorithm: only apply to non-last groups
const verticalSpaces = computed(() => {
  const { gutter } = props;
  const result: VerticalSpaces = [];

  if (Array.isArray(gutter) && gutter.length > 1) {
    const bottom = Number(gutter[1]) || 0;
    if (bottom <= 0) {
      return result;
    }
    groups.value.forEach((group, index) => {
      if (index === groups.value.length - 1) return;
      group.forEach(() => {
        result.push({ bottom });
      });
    });
  }

  return result;
});

provide(ROW_KEY, { spaces, verticalSpaces, register, unregister, updateSpan, getIndex });

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  'space-around': 'space-around',
  'space-between': 'space-between',
};

const alignMap: Record<string, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

const rowStyle = computed(() => {
  const style: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
  };

  if (props.justify) {
    style.justifyContent = justifyMap[props.justify] || 'flex-start';
  }

  if (props.align) {
    style.alignItems = alignMap[props.align] || 'flex-start';
  }

  if (gutterH.value) {
    style.marginLeft = `${-gutterH.value / 2}px`;
    style.marginRight = `${-gutterH.value / 2}px`;
  }

  return style;
});
</script>

<template>
  <view :style="rowStyle">
    <slot />
  </view>
</template>
