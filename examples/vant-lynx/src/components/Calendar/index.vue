<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - lockScroll: Lynx has no document.body scroll to lock
  - closeOnPopstate: Lynx has no browser history API
  - safeAreaInsetTop/Bottom: depends on Lynx host support for env(safe-area-inset-*)
  - overflow: scroll: uses <scroll-view> instead (Lynx does not support overflow: scroll)
  - scrollToDate: simplified implementation without DOM measurement (no getBoundingClientRect)
  - ::after pseudo-element for middle range bg: uses a child <view> instead
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue-lynx';
import { addUnit } from '../../utils/format';
import {
  bem,
  t,
  getToday,
  cloneDate,
  cloneDates,
  getPrevDay,
  getNextDay,
  compareDay,
  calcDateNum,
  compareMonth,
  getDayByOffset,
  getMonthByOffset,
  formatMonthTitle,
} from './utils';
import CalendarMonth from './CalendarMonth.vue';
import CalendarHeader from './CalendarHeader.vue';
import Popup from '../Popup/index.vue';
import Button from '../Button/index.vue';
import { showToast } from '../Toast/toast';
import type {
  CalendarType,
  CalendarSwitchMode,
  CalendarDayItem,
  CalendarExpose,
} from './types';
import './index.less';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    type?: CalendarType;
    switchMode?: CalendarSwitchMode;
    title?: string;
    color?: string;
    round?: boolean;
    readonly?: boolean;
    poppable?: boolean;
    maxRange?: number | string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    teleport?: string | object;
    showMark?: boolean;
    showTitle?: boolean;
    formatter?: (item: CalendarDayItem) => CalendarDayItem;
    rowHeight?: number | string;
    confirmText?: string;
    rangePrompt?: string;
    lazyRender?: boolean;
    showConfirm?: boolean;
    defaultDate?: Date | Date[] | null;
    allowSameDay?: boolean;
    showSubtitle?: boolean;
    showRangePrompt?: boolean;
    confirmDisabledText?: string;
    closeOnClickOverlay?: boolean;
    closeOnPopstate?: boolean;
    safeAreaInsetTop?: boolean;
    safeAreaInsetBottom?: boolean;
    minDate?: Date;
    maxDate?: Date;
    firstDayOfWeek?: number;
  }>(),
  {
    type: 'single',
    switchMode: 'none',
    round: true,
    poppable: true,
    showMark: true,
    showTitle: true,
    showConfirm: true,
    lazyRender: true,
    allowSameDay: false,
    showSubtitle: true,
    showRangePrompt: true,
    closeOnClickOverlay: true,
    closeOnPopstate: true,
    safeAreaInsetBottom: true,
    firstDayOfWeek: 0,
  },
);

const emit = defineEmits<{
  select: [date: Date | Date[]];
  confirm: [date: Date | Date[]];
  unselect: [date: Date];
  monthShow: [info: { date: Date; title: string }];
  overRange: [];
  'update:show': [value: boolean];
  clickSubtitle: [event: any];
  clickDisabledDate: [item: CalendarDayItem];
  clickOverlay: [event: any];
  panelChange: [info: { date: Date }];
}>();

defineSlots<{
  footer?: () => any;
  'confirm-text'?: (props: { disabled: boolean }) => any;
  title?: () => any;
  subtitle?: (props: { date?: Date; text?: string }) => any;
  'prev-month'?: (props: { disabled: boolean }) => any;
  'next-month'?: (props: { disabled: boolean }) => any;
  'prev-year'?: (props: { disabled: boolean }) => any;
  'next-year'?: (props: { disabled: boolean }) => any;
  'top-info'?: (props: CalendarDayItem) => any;
  'bottom-info'?: (props: CalendarDayItem) => any;
  'month-title'?: (props: { date: Date; text: string }) => any;
  text?: (props: CalendarDayItem) => any;
}>();

const canSwitch = computed(() => props.switchMode !== 'none');

const effectiveMinDate = computed(() => {
  if (props.minDate) return props.minDate;
  if (!canSwitch.value) return getToday();
  return undefined;
});

const effectiveMaxDate = computed(() => {
  if (props.maxDate) return props.maxDate;
  if (!canSwitch.value) return getMonthByOffset(getToday(), 6);
  return undefined;
});

const dayOffset = computed(() =>
  props.firstDayOfWeek ? +props.firstDayOfWeek % 7 : 0,
);

// --- Current date state ---

function limitDateRange(
  date: Date,
  min = effectiveMinDate.value,
  max = effectiveMaxDate.value,
) {
  if (min && compareDay(date, min) === -1) return min;
  if (max && compareDay(date, max) === 1) return max;
  return date;
}

function getInitialDate(defaultDate = props.defaultDate): Date | Date[] | null {
  const { type, allowSameDay } = props;

  if (defaultDate === null) return defaultDate;

  const now = getToday();

  if (type === 'range') {
    if (!Array.isArray(defaultDate)) {
      defaultDate = [];
    }
    if (defaultDate.length === 1 && compareDay(defaultDate[0], now) === 1) {
      defaultDate = [];
    }

    const min = effectiveMinDate.value;
    const max = effectiveMaxDate.value;

    const start = limitDateRange(
      defaultDate[0] || now,
      min,
      max ? (allowSameDay ? max : getPrevDay(max)) : undefined,
    );
    const end = limitDateRange(
      defaultDate[1] || (allowSameDay ? now : getNextDay(now)),
      min ? (allowSameDay ? min : getNextDay(min)) : undefined,
    );

    return [start, end];
  }

  if (type === 'multiple') {
    if (Array.isArray(defaultDate)) {
      return defaultDate.map((date) => limitDateRange(date));
    }
    return [limitDateRange(now)];
  }

  if (!defaultDate || Array.isArray(defaultDate)) {
    defaultDate = now;
  }
  return limitDateRange(defaultDate);
}

const currentDate = ref<Date | Date[] | null>(getInitialDate());

const currentPanelDate = ref<Date>(getInitialPanelDate());

function getInitialPanelDate(): Date {
  const date = Array.isArray(currentDate.value)
    ? currentDate.value[0]
    : currentDate.value;
  return date ? date : limitDateRange(getToday());
}

// --- Month refs for tracking ---
const monthRefs = ref<any[]>([]);

function setMonthRef(index: number) {
  return (el: any) => {
    if (el) {
      monthRefs.value[index] = el;
    }
  };
}

const currentMonthRef = ref<any>(null);

// --- Months list (for non-switch mode) ---
const months = computed(() => {
  const result: Date[] = [];
  const min = effectiveMinDate.value;
  const max = effectiveMaxDate.value;

  if (!min || !max) return result;

  const cursor = new Date(min);
  cursor.setDate(1);

  do {
    result.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  } while (compareMonth(cursor, max) !== 1);

  return result;
});

// --- Button disabled state ---
const buttonDisabled = computed(() => {
  if (currentDate.value) {
    if (props.type === 'range') {
      return (
        !(currentDate.value as Date[])[0] ||
        !(currentDate.value as Date[])[1]
      );
    }
    if (props.type === 'multiple') {
      return !(currentDate.value as Date[]).length;
    }
  }
  return !currentDate.value;
});

// --- Subtitle ---
const subtitle = computed(() => {
  if (canSwitch.value) {
    return formatMonthTitle(currentPanelDate.value);
  }
  // For scroll mode, show current visible month
  if (currentMonthRef.value) {
    return typeof currentMonthRef.value.getTitle === 'function'
      ? currentMonthRef.value.getTitle()
      : formatMonthTitle(currentMonthRef.value.date || months.value[0]);
  }
  return months.value.length > 0
    ? formatMonthTitle(months.value[0])
    : '';
});

// --- Range check ---
function checkRange(date: [Date, Date]): boolean {
  const { maxRange, rangePrompt, showRangePrompt } = props;

  if (maxRange && calcDateNum(date) > +maxRange) {
    if (showRangePrompt) {
      showToast({ message: rangePrompt || t('rangePrompt', maxRange) });
    }
    emit('overRange');
    return false;
  }
  return true;
}

// --- Selection ---
function onConfirm() {
  if (currentDate.value) {
    emit('confirm', cloneDates(currentDate.value));
  }
}

function select(date: Date | Date[], complete?: boolean) {
  function setCurrentDate(d: Date | Date[]) {
    currentDate.value = d;
    emit('select', cloneDates(d));
  }

  if (complete && props.type === 'range') {
    const valid = checkRange(date as [Date, Date]);
    if (!valid) {
      setCurrentDate([
        (date as Date[])[0],
        getDayByOffset((date as Date[])[0], +props.maxRange! - 1),
      ]);
      return;
    }
  }

  setCurrentDate(date);

  if (complete && !props.showConfirm) {
    onConfirm();
  }
}

// --- Disabled days ---
const disabledDays = computed(() =>
  monthRefs.value.reduce((arr: CalendarDayItem[], monthRef: any) => {
    if (monthRef?.disabledDays?.value) {
      arr.push(...monthRef.disabledDays.value);
    }
    return arr;
  }, []),
);

function getDisabledDate(
  disabledDaysList: CalendarDayItem[],
  startDay: Date,
  date: Date,
): Date | undefined {
  return disabledDaysList.find(
    (day) =>
      day.date &&
      compareDay(startDay, day.date) === -1 &&
      compareDay(day.date, date) === -1,
  )?.date;
}

// --- Click handlers ---
function onClickDay(item: CalendarDayItem) {
  if (props.readonly || !item.date) return;

  const { date } = item;
  const { type } = props;

  if (type === 'range') {
    if (!currentDate.value) {
      select([date]);
      return;
    }

    const [startDay, endDay] = currentDate.value as [Date, Date];

    if (startDay && !endDay) {
      const compareToStart = compareDay(date, startDay);

      if (compareToStart === 1) {
        const disabledDay = getDisabledDate(
          disabledDays.value,
          startDay,
          date,
        );
        if (disabledDay) {
          const end = getPrevDay(disabledDay);
          if (compareDay(startDay, end) === -1) {
            select([startDay, end]);
          } else {
            select([date]);
          }
        } else {
          select([startDay, date], true);
        }
      } else if (compareToStart === -1) {
        select([date]);
      } else if (props.allowSameDay) {
        select([date, date], true);
      }
    } else {
      select([date]);
    }
  } else if (type === 'multiple') {
    if (!currentDate.value) {
      select([date]);
      return;
    }
    const dates = currentDate.value as Date[];

    const selectedIndex = dates.findIndex(
      (dateItem: Date) => compareDay(dateItem, date) === 0,
    );

    if (selectedIndex !== -1) {
      const [unselectedDate] = dates.splice(selectedIndex, 1);
      emit('unselect', cloneDate(unselectedDate));
    } else if (props.maxRange && dates.length >= +props.maxRange) {
      showToast({
        message: props.rangePrompt || t('rangePrompt', props.maxRange),
      });
    } else {
      select([...dates, date]);
    }
  } else {
    select(date, true);
  }
}

function onClickDisabledDate(item: CalendarDayItem) {
  emit('clickDisabledDate', item);
}

// --- Panel change (for switch mode) ---
function onPanelChange(date: Date) {
  currentPanelDate.value = date;
  emit('panelChange', { date });
}

// --- Popup events ---
function onClickOverlay(event: any) {
  emit('clickOverlay', event);
}

function updateShow(value: boolean) {
  emit('update:show', value);
}

// --- Scroll to date ---
function scrollToDate(targetDate: Date) {
  if (canSwitch.value) {
    currentPanelDate.value = targetDate;
  }
  // In scroll mode, we rely on the user scrolling (no DOM access in Lynx for programmatic scroll)
}

function scrollToCurrentDate() {
  if (props.poppable && !props.show) return;

  if (currentDate.value) {
    const targetDate =
      props.type === 'single'
        ? (currentDate.value as Date)
        : (currentDate.value as Date[])[0];
    if (targetDate instanceof Date) {
      scrollToDate(targetDate);
    }
  }
}

// --- Reset ---
function reset(date?: Date | Date[] | null) {
  currentDate.value = date !== undefined ? date : getInitialDate();
  scrollToCurrentDate();
}

// --- Expose ---
const getSelectedDate = () => currentDate.value;

defineExpose<CalendarExpose>({
  reset,
  scrollToDate,
  getSelectedDate,
});

// --- Watchers ---
watch(() => props.show, () => {
  if (props.show) {
    scrollToCurrentDate();
  }
});

watch(
  () => [props.type, props.minDate, props.maxDate, props.switchMode],
  () => reset(getInitialDate(currentDate.value as any)),
);

watch(
  () => props.defaultDate,
  (value) => {
    reset(value ?? undefined);
  },
);

// Init
onMounted(() => {
  scrollToCurrentDate();
});
</script>

<template>
  <!-- Poppable mode: wrap in Popup -->
  <Popup
    v-if="poppable"
    :show="show"
    :class="bem('popup')"
    :round="round"
    :position="position || 'bottom'"
    :closeable="showTitle || showSubtitle"
    :close-on-click-overlay="closeOnClickOverlay"
    :safe-area-inset-bottom="safeAreaInsetBottom"
    @click-overlay="onClickOverlay"
    @update:show="updateShow"
  >
    <view :class="bem()">
      <CalendarHeader
        :date="canSwitch ? currentPanelDate : (months.length > 0 ? months[0] : undefined)"
        :min-date="effectiveMinDate"
        :max-date="effectiveMaxDate"
        :title="title"
        :subtitle="subtitle"
        :show-title="showTitle"
        :show-subtitle="showSubtitle"
        :switch-mode="switchMode"
        :first-day-of-week="dayOffset"
        @click-subtitle="(e: any) => emit('clickSubtitle', e)"
        @panel-change="onPanelChange"
      >
        <template v-if="$slots.title" #title><slot name="title" /></template>
        <template v-if="$slots.subtitle" #subtitle="sp"><slot name="subtitle" v-bind="sp" /></template>
        <template v-if="$slots['prev-month']" #prev-month="sp"><slot name="prev-month" v-bind="sp" /></template>
        <template v-if="$slots['next-month']" #next-month="sp"><slot name="next-month" v-bind="sp" /></template>
        <template v-if="$slots['prev-year']" #prev-year="sp"><slot name="prev-year" v-bind="sp" /></template>
        <template v-if="$slots['next-year']" #next-year="sp"><slot name="next-year" v-bind="sp" /></template>
      </CalendarHeader>

      <!-- Body: scroll mode or switch mode -->
      <scroll-view
        v-if="!canSwitch"
        :class="bem('body')"
        scroll-orientation="vertical"
      >
        <CalendarMonth
          v-for="(month, index) in months"
          :key="month.getTime()"
          :ref="setMonthRef(index)"
          :date="month"
          :type="type"
          :color="color"
          :min-date="effectiveMinDate"
          :max-date="effectiveMaxDate"
          :show-mark="showMark"
          :row-height="rowHeight"
          :formatter="formatter"
          :lazy-render="false"
          :current-date="currentDate"
          :allow-same-day="allowSameDay"
          :show-subtitle="showSubtitle"
          :show-month-title="index !== 0 || !showSubtitle"
          :first-day-of-week="dayOffset"
          @click="onClickDay"
          @click-disabled-date="onClickDisabledDate"
        >
          <template v-if="$slots['top-info']" #top-info="sp"><slot name="top-info" v-bind="sp" /></template>
          <template v-if="$slots['bottom-info']" #bottom-info="sp"><slot name="bottom-info" v-bind="sp" /></template>
          <template v-if="$slots['month-title']" #month-title="sp"><slot name="month-title" v-bind="sp" /></template>
          <template v-if="$slots.text" #text="sp"><slot name="text" v-bind="sp" /></template>
        </CalendarMonth>
      </scroll-view>

      <view v-else :class="bem('body')">
        <CalendarMonth
          :ref="(el: any) => { currentMonthRef = el }"
          :date="currentPanelDate"
          :type="type"
          :color="color"
          :min-date="effectiveMinDate"
          :max-date="effectiveMaxDate"
          :show-mark="showMark"
          :row-height="rowHeight"
          :formatter="formatter"
          :lazy-render="false"
          :current-date="currentDate"
          :allow-same-day="allowSameDay"
          :show-subtitle="showSubtitle"
          :show-month-title="false"
          :first-day-of-week="dayOffset"
          @click="onClickDay"
          @click-disabled-date="onClickDisabledDate"
        >
          <template v-if="$slots['top-info']" #top-info="sp"><slot name="top-info" v-bind="sp" /></template>
          <template v-if="$slots['bottom-info']" #bottom-info="sp"><slot name="bottom-info" v-bind="sp" /></template>
          <template v-if="$slots['month-title']" #month-title="sp"><slot name="month-title" v-bind="sp" /></template>
          <template v-if="$slots.text" #text="sp"><slot name="text" v-bind="sp" /></template>
        </CalendarMonth>
      </view>

      <!-- Footer -->
      <view :class="bem('footer')">
        <slot name="footer">
          <Button
            v-if="showConfirm"
            round
            block
            type="primary"
            :color="color"
            :class="bem('confirm')"
            :disabled="buttonDisabled"
            @click="onConfirm"
          >
            <slot name="confirm-text" :disabled="buttonDisabled">
              <text>{{ buttonDisabled ? (confirmDisabledText || t('confirm')) : (confirmText || t('confirm')) }}</text>
            </slot>
          </Button>
        </slot>
      </view>
    </view>
  </Popup>

  <!-- Non-poppable mode: render inline -->
  <view v-else :class="bem()">
    <CalendarHeader
      :date="canSwitch ? currentPanelDate : (months.length > 0 ? months[0] : undefined)"
      :min-date="effectiveMinDate"
      :max-date="effectiveMaxDate"
      :title="title"
      :subtitle="subtitle"
      :show-title="showTitle"
      :show-subtitle="showSubtitle"
      :switch-mode="switchMode"
      :first-day-of-week="dayOffset"
      @click-subtitle="(e: any) => emit('clickSubtitle', e)"
      @panel-change="onPanelChange"
    >
      <template v-if="$slots.title" #title><slot name="title" /></template>
      <template v-if="$slots.subtitle" #subtitle="sp"><slot name="subtitle" v-bind="sp" /></template>
      <template v-if="$slots['prev-month']" #prev-month="sp"><slot name="prev-month" v-bind="sp" /></template>
      <template v-if="$slots['next-month']" #next-month="sp"><slot name="next-month" v-bind="sp" /></template>
      <template v-if="$slots['prev-year']" #prev-year="sp"><slot name="prev-year" v-bind="sp" /></template>
      <template v-if="$slots['next-year']" #next-year="sp"><slot name="next-year" v-bind="sp" /></template>
    </CalendarHeader>

    <!-- Body: scroll mode or switch mode -->
    <scroll-view
      v-if="!canSwitch"
      :class="bem('body')"
      scroll-orientation="vertical"
    >
      <CalendarMonth
        v-for="(month, index) in months"
        :key="month.getTime()"
        :ref="setMonthRef(index)"
        :date="month"
        :type="type"
        :color="color"
        :min-date="effectiveMinDate"
        :max-date="effectiveMaxDate"
        :show-mark="showMark"
        :row-height="rowHeight"
        :formatter="formatter"
        :lazy-render="false"
        :current-date="currentDate"
        :allow-same-day="allowSameDay"
        :show-subtitle="showSubtitle"
        :show-month-title="index !== 0 || !showSubtitle"
        :first-day-of-week="dayOffset"
        @click="onClickDay"
        @click-disabled-date="onClickDisabledDate"
      >
        <template v-if="$slots['top-info']" #top-info="sp"><slot name="top-info" v-bind="sp" /></template>
        <template v-if="$slots['bottom-info']" #bottom-info="sp"><slot name="bottom-info" v-bind="sp" /></template>
        <template v-if="$slots['month-title']" #month-title="sp"><slot name="month-title" v-bind="sp" /></template>
        <template v-if="$slots.text" #text="sp"><slot name="text" v-bind="sp" /></template>
      </CalendarMonth>
    </scroll-view>

    <view v-else :class="bem('body')">
      <CalendarMonth
        :ref="(el: any) => { currentMonthRef = el }"
        :date="currentPanelDate"
        :type="type"
        :color="color"
        :min-date="effectiveMinDate"
        :max-date="effectiveMaxDate"
        :show-mark="showMark"
        :row-height="rowHeight"
        :formatter="formatter"
        :lazy-render="false"
        :current-date="currentDate"
        :allow-same-day="allowSameDay"
        :show-subtitle="showSubtitle"
        :show-month-title="false"
        :first-day-of-week="dayOffset"
        @click="onClickDay"
        @click-disabled-date="onClickDisabledDate"
      >
        <template v-if="$slots['top-info']" #top-info="sp"><slot name="top-info" v-bind="sp" /></template>
        <template v-if="$slots['bottom-info']" #bottom-info="sp"><slot name="bottom-info" v-bind="sp" /></template>
        <template v-if="$slots['month-title']" #month-title="sp"><slot name="month-title" v-bind="sp" /></template>
        <template v-if="$slots.text" #text="sp"><slot name="text" v-bind="sp" /></template>
      </CalendarMonth>
    </view>

    <!-- Footer -->
    <view :class="bem('footer')">
      <slot name="footer">
        <Button
          v-if="showConfirm"
          round
          block
          type="primary"
          :color="color"
          :class="bem('confirm')"
          :disabled="buttonDisabled"
          @click="onConfirm"
        >
          <slot name="confirm-text" :disabled="buttonDisabled">
            <text>{{ buttonDisabled ? (confirmDisabledText || t('confirm')) : (confirmText || t('confirm')) }}</text>
          </slot>
        </Button>
      </slot>
    </view>
  </view>
</template>
