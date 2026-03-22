<!--
  CalendarDay — renders a single day cell in the calendar grid.
  Matches Vant's CalendarDay.tsx structure.
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { bem, isLastRowInMonth } from './utils';
import { addUnit } from '../../utils/format';
import type { CalendarDayItem } from './types';

const props = withDefaults(
  defineProps<{
    item: CalendarDayItem;
    color?: string;
    index?: number;
    offset?: number;
    rowHeight?: string;
  }>(),
  {
    offset: 0,
  },
);

const emit = defineEmits<{
  click: [item: CalendarDayItem];
  clickDisabledDate: [item: CalendarDayItem];
}>();

defineSlots<{
  'top-info'?: (props: CalendarDayItem) => any;
  'bottom-info'?: (props: CalendarDayItem) => any;
  text?: (props: CalendarDayItem) => any;
}>();

const dayStyle = computed(() => {
  const { item, index, color, offset, rowHeight } = props;
  const style: Record<string, any> = {};

  if (rowHeight) {
    style.height = rowHeight;
  }

  if (item.type === 'placeholder') {
    style.width = '100%';
    return style;
  }

  if (index === 0) {
    style.marginLeft = `${(100 * offset) / 7}%`;
  }

  if (color) {
    switch (item.type) {
      case 'end':
      case 'start':
      case 'start-end':
      case 'multiple-middle':
      case 'multiple-selected':
        style.background = color;
        break;
      case 'middle':
        style.color = color;
        break;
    }
  }

  if (item.date && isLastRowInMonth(item.date, offset)) {
    style.marginBottom = '0px';
  }

  return style;
});

const selectedDayStyle = computed(() => {
  const { color, rowHeight } = props;
  const style: Record<string, any> = {};
  if (rowHeight) {
    style.width = rowHeight;
    style.height = rowHeight;
  }
  if (color) {
    style.background = color;
  }
  return style;
});

const dayClass = computed(() => {
  const { type, className } = props.item;
  const classes = type ? bem('day', { [type]: true }) : bem('day');
  return [classes, className].filter(Boolean).join(' ');
});

function onClick() {
  if (props.item.type !== 'disabled') {
    emit('click', props.item);
  } else {
    emit('clickDisabledDate', props.item);
  }
}
</script>

<template>
  <!-- Placeholder row -->
  <view
    v-if="item.type === 'placeholder'"
    :class="bem('day')"
    :style="dayStyle"
  />

  <!-- Normal day -->
  <view
    v-else
    :class="dayClass"
    :style="dayStyle"
    @tap="onClick"
  >
    <!-- Selected day (single mode) -->
    <template v-if="item.type === 'selected'">
      <view :class="bem('selected-day')" :style="selectedDayStyle">
        <view v-if="item.topInfo || $slots['top-info']" :class="bem('top-info')">
          <slot name="top-info" v-bind="item">
            <text>{{ item.topInfo }}</text>
          </slot>
        </view>
        <slot name="text" v-bind="item">
          <text>{{ item.text }}</text>
        </slot>
        <view v-if="item.bottomInfo || $slots['bottom-info']" :class="bem('bottom-info')">
          <slot name="bottom-info" v-bind="item">
            <text>{{ item.bottomInfo }}</text>
          </slot>
        </view>
      </view>
    </template>

    <!-- Non-selected day -->
    <template v-else>
      <view v-if="item.topInfo || $slots['top-info']" :class="bem('top-info')">
        <slot name="top-info" v-bind="item">
          <text>{{ item.topInfo }}</text>
        </slot>
      </view>
      <slot name="text" v-bind="item">
        <text>{{ item.text }}</text>
      </slot>
      <view v-if="item.bottomInfo || $slots['bottom-info']" :class="bem('bottom-info')">
        <slot name="bottom-info" v-bind="item">
          <text>{{ item.bottomInfo }}</text>
        </slot>
      </view>
      <!-- Middle range background (replaces ::after pseudo-element) -->
      <view v-if="item.type === 'middle'" :class="bem('day-middle-bg')" />
    </template>
  </view>
</template>
