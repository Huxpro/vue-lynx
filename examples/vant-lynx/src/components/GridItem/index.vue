<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface GridItemProps {
  text?: string;
  icon?: string;
  dot?: boolean;
  badge?: string | number;
}

const props = withDefaults(defineProps<GridItemProps>(), {
  dot: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const grid = inject<{
  columnNum: Ref<number>;
  iconSize: Ref<number>;
  gutter: Ref<number>;
  border: Ref<boolean>;
  center: Ref<boolean>;
  square: Ref<boolean>;
  clickable: Ref<boolean>;
}>('grid')!;

const itemWidth = computed(() => {
  return `${100 / grid.columnNum.value}%`;
});

const itemStyle = computed(() => {
  const gutter = grid.gutter.value;
  const hasBorder = grid.border.value && !gutter;

  return {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: grid.center.value ? 'center' : 'flex-start',
    justifyContent: grid.center.value ? 'center' : 'flex-start',
    width: itemWidth.value,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderRightWidth: hasBorder ? 0.5 : 0,
    borderRightStyle: 'solid' as const,
    borderRightColor: '#ebedf0',
    borderBottomWidth: hasBorder ? 0.5 : 0,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: '#ebedf0',
    marginRight: gutter ? gutter : 0,
    marginBottom: gutter ? gutter : 0,
  };
});

const iconStyle = computed(() => ({
  fontSize: grid.iconSize.value,
  color: '#323233',
  marginBottom: 8,
}));

const textStyle = computed(() => ({
  fontSize: 12,
  color: '#646566',
  lineHeight: 18,
}));

function onTap(event: any) {
  if (grid.clickable.value) {
    emit('click', event);
  }
}
</script>

<template>
  <view :style="itemStyle" @tap="onTap">
    <!-- Icon area -->
    <view :style="{ position: 'relative', marginBottom: 8 }">
      <slot name="icon">
        <text v-if="icon" :style="iconStyle">{{ icon }}</text>
      </slot>
      <view v-if="dot" :style="{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ee0a24', position: 'absolute', top: 0, right: -4 }" />
      <text v-else-if="badge !== undefined && badge !== ''" :style="{ fontSize: 10, color: '#fff', backgroundColor: '#ee0a24', borderRadius: 8, paddingLeft: 4, paddingRight: 4, minWidth: 16, height: 16, lineHeight: 16, textAlign: 'center', position: 'absolute', top: -4, right: -8 }">{{ badge }}</text>
    </view>

    <!-- Text -->
    <slot name="text">
      <text v-if="text" :style="textStyle">{{ text }}</text>
    </slot>

    <slot />
  </view>
</template>
