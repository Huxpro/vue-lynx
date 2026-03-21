<!--
  Vant Feature Parity Report:
  - Props: 4/4 supported (dashed, hairline, contentPosition, vertical)
  - Events: 0/0 (none defined)
  - Slots: 1/1 (default - text content between lines)
  - Lynx Limitations:
    - Uses explicit view elements for lines (no CSS ::before/::after)
    - Vertical mode renders as inline vertical bar
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

export interface DividerProps {
  contentPosition?: 'left' | 'center' | 'right';
  dashed?: boolean;
  hairline?: boolean;
  vertical?: boolean;
}

const props = withDefaults(defineProps<DividerProps>(), {
  contentPosition: 'center',
  dashed: false,
  hairline: true,
  vertical: false,
});

const slots = useSlots();

const hasContent = computed(() => !!slots.default);

const containerStyle = computed(() => {
  if (props.vertical) {
    return {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      marginLeft: 8,
      marginRight: 8,
      height: 14,
    };
  }
  return {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
  };
});

const baseLineStyle = computed(() => {
  if (props.vertical) {
    return {
      width: 0,
      height: '100%',
      borderLeftWidth: props.hairline ? 0.5 : 1,
      borderLeftStyle: props.dashed ? ('dashed' as const) : ('solid' as const),
      borderLeftColor: '#ebedf0',
    };
  }
  return {
    height: 0,
    borderTopWidth: props.hairline ? 0.5 : 1,
    borderTopStyle: props.dashed ? ('dashed' as const) : ('solid' as const),
    borderTopColor: '#ebedf0',
  };
});

const leftLineStyle = computed(() => {
  if (props.vertical) return baseLineStyle.value;
  if (!hasContent.value) {
    return { ...baseLineStyle.value, flex: 1 };
  }
  return {
    ...baseLineStyle.value,
    flex: props.contentPosition === 'left' ? 1 : 10,
    marginRight: 16,
  };
});

const rightLineStyle = computed(() => {
  if (props.vertical) return { ...baseLineStyle.value, flex: 0, width: 0 };
  if (!hasContent.value) {
    return { ...baseLineStyle.value, flex: 0, width: 0 };
  }
  return {
    ...baseLineStyle.value,
    flex: props.contentPosition === 'right' ? 1 : 10,
    marginLeft: 16,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <view :style="leftLineStyle" />
    <slot />
    <view v-if="hasContent" :style="rightLineStyle" />
  </view>
</template>
