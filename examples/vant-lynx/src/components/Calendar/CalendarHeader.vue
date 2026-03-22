<!--
  CalendarHeader — renders title, subtitle with navigation arrows, and weekday labels.
  Matches Vant's CalendarHeader.tsx structure.
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import {
  bem,
  t,
  compareMonth,
  getPrevMonth,
  getPrevYear,
  getNextMonth,
  getNextYear,
} from './utils';
import type { CalendarSwitchMode } from './types';

const props = withDefaults(
  defineProps<{
    date?: Date;
    minDate?: Date;
    maxDate?: Date;
    title?: string;
    subtitle?: string;
    showTitle?: boolean;
    showSubtitle?: boolean;
    firstDayOfWeek?: number;
    switchMode?: CalendarSwitchMode;
  }>(),
  {
    showTitle: true,
    showSubtitle: true,
    firstDayOfWeek: 0,
    switchMode: 'none',
  },
);

const emit = defineEmits<{
  clickSubtitle: [event: any];
  panelChange: [date: Date];
}>();

defineSlots<{
  title?: () => any;
  subtitle?: (props: { date?: Date; text?: string }) => any;
  'prev-month'?: (props: { disabled: boolean }) => any;
  'next-month'?: (props: { disabled: boolean }) => any;
  'prev-year'?: (props: { disabled: boolean }) => any;
  'next-year'?: (props: { disabled: boolean }) => any;
}>();

const prevMonthDisabled = computed(
  () =>
    !!(
      props.date &&
      props.minDate &&
      compareMonth(getPrevMonth(props.date), props.minDate) < 0
    ),
);

const prevYearDisabled = computed(
  () =>
    !!(
      props.date &&
      props.minDate &&
      compareMonth(getPrevYear(props.date), props.minDate) < 0
    ),
);

const nextMonthDisabled = computed(
  () =>
    !!(
      props.date &&
      props.maxDate &&
      compareMonth(getNextMonth(props.date), props.maxDate) > 0
    ),
);

const nextYearDisabled = computed(
  () =>
    !!(
      props.date &&
      props.maxDate &&
      compareMonth(getNextYear(props.date), props.maxDate) > 0
    ),
);

const canSwitch = computed(() => props.switchMode !== 'none');
const showYearAction = computed(() => props.switchMode === 'year-month');

const weekdays = computed(() => {
  const allDays: string[] = t('weekdays');
  const offset = props.firstDayOfWeek || 0;
  return [...allDays.slice(offset), ...allDays.slice(0, offset)];
});

function onClickSubtitle(event: any) {
  emit('clickSubtitle', event);
}

function onPanelChange(date: Date) {
  emit('panelChange', date);
}

function onPrevMonth() {
  if (!prevMonthDisabled.value && props.date) {
    onPanelChange(getPrevMonth(props.date));
  }
}

function onNextMonth() {
  if (!nextMonthDisabled.value && props.date) {
    onPanelChange(getNextMonth(props.date));
  }
}

function onPrevYear() {
  if (!prevYearDisabled.value && props.date) {
    onPanelChange(getPrevYear(props.date));
  }
}

function onNextYear() {
  if (!nextYearDisabled.value && props.date) {
    onPanelChange(getNextYear(props.date));
  }
}
</script>

<template>
  <view :class="bem('header')">
    <!-- Title -->
    <view v-if="showTitle" :class="bem('header-title')">
      <slot name="title">
        <text>{{ title || t('title') }}</text>
      </slot>
    </view>

    <!-- Subtitle (with optional navigation) -->
    <view
      v-if="showSubtitle"
      :class="bem('header-subtitle', { 'with-switch': canSwitch })"
      @tap="onClickSubtitle"
    >
      <!-- Navigation: prev actions -->
      <template v-if="canSwitch">
        <!-- Prev year (year-month mode only) -->
        <view
          v-if="showYearAction"
          :class="bem('header-action', { disabled: prevYearDisabled })"
          @tap.stop="onPrevYear"
        >
          <slot name="prev-year" :disabled="prevYearDisabled">
            <Icon name="arrow-double-left" />
          </slot>
        </view>
        <!-- Prev month -->
        <view
          :class="bem('header-action', { disabled: prevMonthDisabled })"
          @tap.stop="onPrevMonth"
        >
          <slot name="prev-month" :disabled="prevMonthDisabled">
            <Icon name="arrow-left" />
          </slot>
        </view>
      </template>

      <!-- Subtitle text -->
      <view v-if="canSwitch" :class="bem('header-subtitle-text')">
        <slot name="subtitle" :date="date" :text="subtitle">
          <text>{{ subtitle }}</text>
        </slot>
      </view>
      <slot v-else name="subtitle" :date="date" :text="subtitle">
        <text>{{ subtitle }}</text>
      </slot>

      <!-- Navigation: next actions -->
      <template v-if="canSwitch">
        <!-- Next month -->
        <view
          :class="bem('header-action', { disabled: nextMonthDisabled })"
          @tap.stop="onNextMonth"
        >
          <slot name="next-month" :disabled="nextMonthDisabled">
            <Icon name="arrow" />
          </slot>
        </view>
        <!-- Next year (year-month mode only) -->
        <view
          v-if="showYearAction"
          :class="bem('header-action', { disabled: nextYearDisabled })"
          @tap.stop="onNextYear"
        >
          <slot name="next-year" :disabled="nextYearDisabled">
            <Icon name="arrow-double-right" />
          </slot>
        </view>
      </template>
    </view>

    <!-- Weekday labels -->
    <view :class="bem('weekdays')">
      <view v-for="day in weekdays" :key="day" :class="bem('weekday')">
        <text>{{ day }}</text>
      </view>
    </view>
  </view>
</template>
