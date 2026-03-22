<!--
  Lynx Limitations:
  - ::before/::after pseudo-elements: Not supported in Lynx; uses explicit <view> elements for divider lines
  - role="separator": HTML accessibility attributes not applicable in Lynx
  - CSS class-based styling: Lynx uses inline styles; CSS variables in index.less are defined for theming reference only
  - vertical mode: Renders as inline vertical bar using explicit view elements
  - scaleY(0.5) hairline: Lynx does not support transform scale; uses 0.5px border width instead
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import type { DividerContentPosition } from './types';

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

const borderStyle = computed(() =>
  props.dashed ? ('dashed' as const) : ('solid' as const),
);

const borderWidth = computed(() => (props.hairline ? '0.5px' : '1px'));

const containerStyle = computed(() => {
  if (props.vertical) {
    return {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      marginLeft: '8px',
      marginRight: '8px',
      height: '14px',
    };
  }
  return {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: '16px',
    marginBottom: '16px',
    color: '#969799',
    fontSize: '14px',
    lineHeight: '24px',
  };
});

const leftLineStyle = computed(() => {
  if (props.vertical) {
    return {
      width: '0px',
      height: '100%',
      borderLeftWidth: borderWidth.value,
      borderLeftStyle: borderStyle.value,
      borderLeftColor: '#ebedf0',
    };
  }
  const base = {
    height: '0px',
    borderTopWidth: borderWidth.value,
    borderTopStyle: borderStyle.value,
    borderTopColor: '#ebedf0',
  };
  if (!hasContent.value) {
    return { ...base, flex: 1 };
  }
  return {
    ...base,
    flex: props.contentPosition === 'left' ? 1 : 10,
    marginRight: '16px',
  };
});

const rightLineStyle = computed(() => {
  if (!hasContent.value) {
    return { display: 'none' as const };
  }
  return {
    height: '0px',
    borderTopWidth: borderWidth.value,
    borderTopStyle: borderStyle.value,
    borderTopColor: '#ebedf0',
    flex: props.contentPosition === 'right' ? 1 : 10,
    marginLeft: '16px',
  };
});
</script>

<template>
  <view :style="containerStyle">
    <view :style="leftLineStyle" />
    <template v-if="hasContent">
      <slot />
    </template>
    <view v-if="hasContent" :style="rightLineStyle" />
  </view>
</template>
