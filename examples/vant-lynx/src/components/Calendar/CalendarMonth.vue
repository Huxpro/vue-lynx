<!--
  CalendarMonth — renders a single month with title, mark, and day grid.
  Matches Vant's CalendarMonth.tsx structure.
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import { addUnit } from '../../utils/format';
import {
  bem,
  t,
  compareDay,
  getPrevDay,
  getNextDay,
  formatMonthTitle,
  getMonthEndDay,
} from './utils';
import CalendarDay from './CalendarDay.vue';
import type { CalendarType, CalendarDayItem, CalendarDayType } from './types';

const props = withDefaults(
  defineProps<{
    date: Date;
    type?: CalendarType;
    color?: string;
    minDate?: Date;
    maxDate?: Date;
    showMark?: boolean;
    rowHeight?: number | string;
    formatter?: (item: CalendarDayItem) => CalendarDayItem;
    lazyRender?: boolean;
    currentDate?: Date | Date[] | null;
    allowSameDay?: boolean;
    showSubtitle?: boolean;
    showMonthTitle?: boolean;
    firstDayOfWeek?: number;
  }>(),
  {
    type: 'single',
    showMark: true,
    lazyRender: true,
    showMonthTitle: true,
    firstDayOfWeek: 0,
  },
);

const emit = defineEmits<{
  click: [item: CalendarDayItem];
  clickDisabledDate: [item: CalendarDayItem];
}>();

defineSlots<{
  'month-title'?: (props: { date: Date; text: string }) => any;
  'top-info'?: (props: CalendarDayItem) => any;
  'bottom-info'?: (props: CalendarDayItem) => any;
  text?: (props: CalendarDayItem) => any;
}>();

const visible = ref(false);

const title = computed(() => formatMonthTitle(props.date));
const rowHeightStr = computed(() => addUnit(props.rowHeight));

const offset = computed(() => {
  const dateNum = props.date.getDate();
  const day = props.date.getDay();
  const realDay = (day - (dateNum % 7) + 8) % 7;
  if (props.firstDayOfWeek) {
    return (realDay + 7 - props.firstDayOfWeek) % 7;
  }
  return realDay;
});

const totalDay = computed(() =>
  getMonthEndDay(props.date.getFullYear(), props.date.getMonth() + 1),
);

const shouldRender = computed(() => visible.value || !props.lazyRender);

function getMultipleDayType(day: Date): CalendarDayType {
  const isSelected = (date: Date) =>
    (props.currentDate as Date[]).some(
      (item) => compareDay(item, date) === 0,
    );

  if (isSelected(day)) {
    const prevDay = getPrevDay(day);
    const nextDay = getNextDay(day);
    const prevSelected = isSelected(prevDay);
    const nextSelected = isSelected(nextDay);

    if (prevSelected && nextSelected) return 'multiple-middle';
    if (prevSelected) return 'end';
    if (nextSelected) return 'start';
    return 'multiple-selected';
  }

  return '';
}

function getRangeDayType(day: Date): CalendarDayType {
  const [startDay, endDay] = props.currentDate as Date[];

  if (!startDay) return '';

  const compareToStart = compareDay(day, startDay);

  if (!endDay) {
    return compareToStart === 0 ? 'start' : '';
  }

  const compareToEnd = compareDay(day, endDay);

  if (props.allowSameDay && compareToStart === 0 && compareToEnd === 0) {
    return 'start-end';
  }
  if (compareToStart === 0) return 'start';
  if (compareToEnd === 0) return 'end';
  if (compareToStart > 0 && compareToEnd < 0) return 'middle';

  return '';
}

function getDayType(day: Date): CalendarDayType {
  const { type, minDate, maxDate, currentDate } = props;

  if (
    (minDate && compareDay(day, minDate) < 0) ||
    (maxDate && compareDay(day, maxDate) > 0)
  ) {
    return 'disabled';
  }

  if (currentDate === null || currentDate === undefined) {
    return '';
  }

  if (Array.isArray(currentDate)) {
    if (type === 'multiple') return getMultipleDayType(day);
    if (type === 'range') return getRangeDayType(day);
  } else if (type === 'single') {
    return compareDay(day, currentDate as Date) === 0 ? 'selected' : '';
  }

  return '';
}

function getBottomInfo(dayType: CalendarDayType): string | undefined {
  if (props.type === 'range') {
    if (dayType === 'start' || dayType === 'end') {
      return t(dayType);
    }
    if (dayType === 'start-end') {
      return `${t('start')}/${t('end')}`;
    }
  }
  return undefined;
}

const placeholders = computed<CalendarDayItem[]>(() => {
  const count = Math.ceil((totalDay.value + offset.value) / 7);
  return Array(count).fill({ type: 'placeholder' });
});

const days = computed(() => {
  const result: CalendarDayItem[] = [];
  const year = props.date.getFullYear();
  const month = props.date.getMonth();

  for (let day = 1; day <= totalDay.value; day++) {
    const date = new Date(year, month, day);
    const type = getDayType(date);

    let config: CalendarDayItem = {
      date,
      type,
      text: day,
      bottomInfo: getBottomInfo(type),
    };

    if (props.formatter) {
      config = props.formatter(config);
    }

    result.push(config);
  }

  return result;
});

const disabledDays = computed(() =>
  days.value.filter((day) => day.type === 'disabled'),
);

const renderDays = computed(() =>
  shouldRender.value ? days.value : placeholders.value,
);

function getTitle(): string {
  return title.value;
}

function setVisible(val: boolean) {
  visible.value = val;
}

// Expose for parent
defineExpose({
  date: props.date,
  getTitle,
  setVisible,
  disabledDays,
  showed: false,
});
</script>

<template>
  <view :class="bem('month')">
    <!-- Month title -->
    <view v-if="showMonthTitle" :class="bem('month-title')">
      <slot name="month-title" :date="date" :text="title">
        <text>{{ title }}</text>
      </slot>
    </view>

    <!-- Days grid -->
    <view :class="bem('days')">
      <!-- Month mark (large month number) -->
      <view v-if="showMark && shouldRender" :class="bem('month-mark')">
        <text>{{ date.getMonth() + 1 }}</text>
      </view>

      <!-- Day cells -->
      <CalendarDay
        v-for="(item, index) in renderDays"
        :key="index"
        :item="item"
        :index="index"
        :color="color"
        :offset="offset"
        :row-height="rowHeightStr"
        @click="(item: CalendarDayItem) => emit('click', item)"
        @click-disabled-date="(item: CalendarDayItem) => emit('clickDisabledDate', item)"
      >
        <template v-if="$slots['top-info']" #top-info="slotProps">
          <slot name="top-info" v-bind="slotProps" />
        </template>
        <template v-if="$slots['bottom-info']" #bottom-info="slotProps">
          <slot name="bottom-info" v-bind="slotProps" />
        </template>
        <template v-if="$slots.text" #text="slotProps">
          <slot name="text" v-bind="slotProps" />
        </template>
      </CalendarDay>
    </view>
  </view>
</template>
