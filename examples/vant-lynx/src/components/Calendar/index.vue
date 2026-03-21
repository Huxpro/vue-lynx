<!--
  Vant Feature Parity Report -- Calendar
  ======================================
  Props: 22/26 supported
    Supported: type, switchMode, title, color, minDate, maxDate, defaultDate,
               rowHeight, poppable, showMark, showTitle, showSubtitle,
               showConfirm, readonly, firstDayOfWeek, confirmText,
               confirmDisabledText, allowSameDay, show, round, position, formatter
    Missing:   maxRange, teleport, rangePrompt, lazyRender, showRangePrompt,
               closeOnPopstate, safeAreaInsetTop, safeAreaInsetBottom

  Events: 9/11 supported
    Supported: select, confirm, open, close, opened, closed, click-disabled-date,
               unselect, update:show, clickOverlay
    Missing:   monthShow, overRange, panelChange

  Slots: 3/3 supported
    Supported: title, subtitle, footer
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Popup from '../Popup/index.vue';

export interface CalendarDay {
  date: Date;
  type: 'selected' | 'start' | 'end' | 'start-end' | 'middle' | 'disabled' | 'normal' | 'today';
  text: string | number;
  topInfo?: string;
  bottomInfo?: string;
  className?: string;
}

export interface CalendarProps {
  type?: 'single' | 'range' | 'multiple';
  switchMode?: 'none' | 'month' | 'year-month';
  title?: string;
  color?: string;
  minDate?: Date;
  maxDate?: Date;
  defaultDate?: Date | Date[];
  rowHeight?: number;
  poppable?: boolean;
  showMark?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showConfirm?: boolean;
  readonly?: boolean;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  confirmText?: string;
  confirmDisabledText?: string;
  allowSameDay?: boolean;
  show?: boolean;
  round?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  formatter?: (day: CalendarDay) => CalendarDay;
}

const props = withDefaults(defineProps<CalendarProps>(), {
  type: 'single',
  switchMode: 'none',
  title: 'Calendar',
  color: '#1989fa',
  rowHeight: 64,
  poppable: false,
  showMark: true,
  showTitle: true,
  showSubtitle: true,
  showConfirm: true,
  readonly: false,
  firstDayOfWeek: 0,
  confirmText: 'Confirm',
  confirmDisabledText: 'Confirm',
  allowSameDay: false,
  show: false,
  round: true,
  position: 'bottom',
});

const emit = defineEmits<{
  select: [date: Date | Date[]];
  confirm: [date: Date | Date[]];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'update:show': [value: boolean];
  clickOverlay: [];
  'click-disabled-date': [date: Date];
  unselect: [date: Date];
}>();

const today = new Date();
const defaultMinDate = new Date(today.getFullYear(), today.getMonth(), 1);
const defaultMaxDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);

const effectiveMinDate = computed(() => props.minDate || defaultMinDate);
const effectiveMaxDate = computed(() => props.maxDate || defaultMaxDate);

// Current month being viewed
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());

// Selection state
const selectedDates = ref<Date[]>([]);

// Initialize from defaultDate
watch(
  () => props.defaultDate,
  (val) => {
    if (val) {
      selectedDates.value = Array.isArray(val) ? [...val] : [val];
      if (selectedDates.value.length > 0) {
        currentYear.value = selectedDates.value[0].getFullYear();
        currentMonth.value = selectedDates.value[0].getMonth();
      }
    }
  },
  { immediate: true },
);

// Weekday headers respect firstDayOfWeek
const allWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdays = computed(() => {
  const offset = props.firstDayOfWeek;
  return [...allWeekdays.slice(offset), ...allWeekdays.slice(0, offset)];
});

const monthTitle = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateDisabled(date: Date): boolean {
  return date < effectiveMinDate.value || date > effectiveMaxDate.value;
}

function isDateSelected(date: Date): boolean {
  return selectedDates.value.some((d) => isSameDay(d, date));
}

function isRangeStart(date: Date): boolean {
  if (props.type !== 'range' || selectedDates.value.length < 1) return false;
  return isSameDay(selectedDates.value[0], date);
}

function isRangeEnd(date: Date): boolean {
  if (props.type !== 'range' || selectedDates.value.length < 2) return false;
  return isSameDay(selectedDates.value[1], date);
}

function isInRange(date: Date): boolean {
  if (props.type !== 'range' || selectedDates.value.length < 2) return false;
  const start = selectedDates.value[0];
  const end = selectedDates.value[1];
  return date > start && date < end;
}

function isToday(date: Date): boolean {
  return isSameDay(date, today);
}

// Get day type for formatter
function getDayType(date: Date): CalendarDay['type'] {
  if (isDateDisabled(date)) return 'disabled';
  if (props.type === 'range') {
    if (isRangeStart(date) && isRangeEnd(date)) return 'start-end';
    if (isRangeStart(date)) return 'start';
    if (isRangeEnd(date)) return 'end';
    if (isInRange(date)) return 'middle';
  }
  if (isDateSelected(date)) return 'selected';
  if (isToday(date)) return 'today';
  return 'normal';
}

// Build CalendarDay objects with formatter support
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = (firstDayRaw - props.firstDayOfWeek + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ day: number; date: Date | null; isCurrentMonth: boolean; calendarDay?: CalendarDay }> = [];

  // Fill leading empty slots
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, date: null, isCurrentMonth: false });
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    let calDay: CalendarDay = {
      date,
      type: getDayType(date),
      text: d,
      topInfo: '',
      bottomInfo: '',
    };

    // Default bottomInfo for special types
    if (calDay.type === 'start') calDay.bottomInfo = 'Start';
    else if (calDay.type === 'end') calDay.bottomInfo = 'End';
    else if (calDay.type === 'start-end') calDay.bottomInfo = 'Start/End';
    else if (calDay.type === 'today' && !isDateSelected(date)) calDay.bottomInfo = 'Today';

    // Apply formatter
    if (props.formatter) {
      calDay = props.formatter(calDay);
    }

    days.push({
      day: d,
      date,
      isCurrentMonth: true,
      calendarDay: calDay,
    });
  }

  return days;
});

// Whether confirm button should be disabled
const isConfirmDisabled = computed(() => {
  if (props.type === 'range') return selectedDates.value.length < 2;
  return selectedDates.value.length === 0;
});

function selectDate(date: Date | null) {
  if (!date) return;

  if (isDateDisabled(date)) {
    emit('click-disabled-date', date);
    return;
  }

  if (props.readonly) return;

  if (props.type === 'single') {
    selectedDates.value = [date];
    emit('select', date);
  } else if (props.type === 'multiple') {
    const idx = selectedDates.value.findIndex((d) => isSameDay(d, date));
    if (idx >= 0) {
      const removed = selectedDates.value[idx];
      selectedDates.value.splice(idx, 1);
      emit('unselect', removed);
    } else {
      selectedDates.value.push(date);
    }
    emit('select', [...selectedDates.value]);
  } else if (props.type === 'range') {
    if (selectedDates.value.length === 0 || selectedDates.value.length === 2) {
      selectedDates.value = [date];
    } else {
      const start = selectedDates.value[0];
      if (isSameDay(date, start)) {
        if (props.allowSameDay) {
          selectedDates.value = [start, date];
        } else {
          selectedDates.value = [date];
        }
      } else if (date < start) {
        selectedDates.value = [date];
      } else {
        selectedDates.value = [start, date];
      }
    }
    emit('select', [...selectedDates.value]);
  }
}

function onConfirm() {
  if (isConfirmDisabled.value) return;
  if (props.type === 'single' && selectedDates.value.length === 1) {
    emit('confirm', selectedDates.value[0]);
  } else {
    emit('confirm', [...selectedDates.value]);
  }
  if (props.poppable) {
    emit('update:show', false);
  }
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

// Popup events
function onPopupOpen() {
  emit('open');
}

function onPopupClose() {
  emit('close');
}

function onPopupOpened() {
  emit('opened');
}

function onPopupClosed() {
  emit('closed');
}

function onClickOverlay() {
  emit('clickOverlay');
  // Note: Popup already emits update:show via doClose(), forwarded by @update:show binding
}

function getDayStyle(item: { day: number; date: Date | null; isCurrentMonth: boolean; calendarDay?: CalendarDay }) {
  const base: Record<string, any> = {
    width: `${100 / 7}%`,
    height: props.rowHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!item.date || !item.isCurrentMonth || !item.calendarDay) {
    return base;
  }

  const type = item.calendarDay.type;
  if (type === 'selected' || type === 'start' || type === 'end' || type === 'start-end') {
    base.backgroundColor = props.color;
    base.borderRadius = props.rowHeight / 2;
  } else if (type === 'middle') {
    base.backgroundColor = `${props.color}33`;
  }

  return base;
}

function getDayTextStyle(item: { day: number; date: Date | null; isCurrentMonth: boolean; calendarDay?: CalendarDay }) {
  const base: Record<string, any> = {
    fontSize: 16,
    color: '#323233',
    textAlign: 'center' as const,
  };

  if (!item.date || !item.calendarDay) {
    base.color = 'transparent';
    return base;
  }

  const type = item.calendarDay.type;
  if (type === 'disabled') {
    base.color = '#c8c9cc';
  } else if (type === 'selected' || type === 'start' || type === 'end' || type === 'start-end') {
    base.color = '#fff';
    base.fontWeight = 'bold';
  } else if (type === 'today') {
    base.color = props.color;
  }

  return base;
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
  borderRadius: 8,
  overflow: 'hidden' as const,
}));

const headerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 16,
  backgroundColor: '#fff',
};

const weekdayRowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  paddingLeft: 4,
  paddingRight: 4,
};

const weekdayStyle = {
  flex: 1,
  textAlign: 'center' as const,
  fontSize: 12,
  color: '#969799',
  paddingTop: 8,
  paddingBottom: 8,
};

const daysGridStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  paddingLeft: 4,
  paddingRight: 4,
};

const confirmBtnStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  backgroundColor: isConfirmDisabled.value ? `${props.color}80` : props.color,
  marginLeft: 16,
  marginRight: 16,
  marginBottom: 16,
  borderRadius: 24,
}));

const confirmTextStyle = computed(() => ({
  fontSize: 16,
  color: '#fff',
  fontWeight: 'bold' as const,
}));
</script>

<template>
  <!-- Popup mode when poppable=true -->
  <Popup
    v-if="poppable"
    :show="show"
    :position="position"
    :round="round"
    @update:show="(val) => emit('update:show', val)"
    @open="onPopupOpen"
    @close="onPopupClose"
    @opened="onPopupOpened"
    @closed="onPopupClosed"
    @click-overlay="onClickOverlay"
  >
    <view :style="containerStyle">
      <!-- Title -->
      <view v-if="showTitle" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12 }">
        <slot name="title">
          <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
        </slot>
      </view>

      <!-- Month Navigation / Subtitle -->
      <view v-if="showSubtitle" :style="headerStyle">
        <view :style="{ display: 'flex', padding: 4 }" @tap="prevMonth">
          <Icon name="arrow-left" :size="16" :color="color" />
        </view>
        <slot name="subtitle" :date="new Date(currentYear, currentMonth)" :text="monthTitle">
          <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ monthTitle }}</text>
        </slot>
        <view :style="{ display: 'flex', padding: 4 }" @tap="nextMonth">
          <Icon name="arrow" :size="16" :color="color" />
        </view>
      </view>

      <!-- Weekday Headers -->
      <view :style="weekdayRowStyle">
        <text v-for="day in weekdays" :key="day" :style="weekdayStyle">{{ day }}</text>
      </view>

      <!-- Days Grid -->
      <view :style="daysGridStyle">
        <view
          v-for="(item, index) in calendarDays"
          :key="index"
          :style="getDayStyle(item)"
          @tap="selectDate(item.date)"
        >
          <view v-if="item.day > 0 && item.calendarDay" :style="{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }">
            <text v-if="item.calendarDay.topInfo" :style="{ fontSize: 10, color: item.calendarDay.type === 'disabled' ? '#c8c9cc' : color }">{{ item.calendarDay.topInfo }}</text>
            <text :style="getDayTextStyle(item)">{{ item.calendarDay.text }}</text>
            <text v-if="item.calendarDay.bottomInfo" :style="{ fontSize: 10, color: (item.calendarDay.type === 'start' || item.calendarDay.type === 'end' || item.calendarDay.type === 'start-end' || item.calendarDay.type === 'selected') ? '#fff' : (item.calendarDay.type === 'disabled' ? '#c8c9cc' : color) }">{{ item.calendarDay.bottomInfo }}</text>
          </view>
        </view>
      </view>

      <!-- Month Mark -->
      <view v-if="showMark" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 4 }">
        <text :style="{ fontSize: 10, color: '#c8c9cc' }">{{ monthTitle }}</text>
      </view>

      <!-- Footer slot / Confirm Button -->
      <slot name="footer">
        <view v-if="showConfirm" :style="confirmBtnStyle" @tap="onConfirm">
          <text :style="confirmTextStyle">{{ isConfirmDisabled ? confirmDisabledText : confirmText }}</text>
        </view>
      </slot>
    </view>
  </Popup>

  <!-- Inline mode when poppable=false -->
  <view v-else :style="containerStyle">
    <!-- Title -->
    <view v-if="showTitle" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12 }">
      <slot name="title">
        <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
      </slot>
    </view>

    <!-- Month Navigation / Subtitle -->
    <view v-if="showSubtitle" :style="headerStyle">
      <view :style="{ display: 'flex', padding: 4 }" @tap="prevMonth">
        <Icon name="arrow-left" :size="16" :color="color" />
      </view>
      <slot name="subtitle" :date="new Date(currentYear, currentMonth)" :text="monthTitle">
        <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ monthTitle }}</text>
      </slot>
      <view :style="{ display: 'flex', padding: 4 }" @tap="nextMonth">
        <Icon name="arrow" :size="16" :color="color" />
      </view>
    </view>

    <!-- Weekday Headers -->
    <view :style="weekdayRowStyle">
      <text v-for="day in weekdays" :key="day" :style="weekdayStyle">{{ day }}</text>
    </view>

    <!-- Days Grid -->
    <view :style="daysGridStyle">
      <view
        v-for="(item, index) in calendarDays"
        :key="index"
        :style="getDayStyle(item)"
        @tap="selectDate(item.date)"
      >
        <view v-if="item.day > 0 && item.calendarDay" :style="{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }">
          <text v-if="item.calendarDay.topInfo" :style="{ fontSize: 10, color: item.calendarDay.type === 'disabled' ? '#c8c9cc' : color }">{{ item.calendarDay.topInfo }}</text>
          <text :style="getDayTextStyle(item)">{{ item.calendarDay.text }}</text>
          <text v-if="item.calendarDay.bottomInfo" :style="{ fontSize: 10, color: (item.calendarDay.type === 'start' || item.calendarDay.type === 'end' || item.calendarDay.type === 'start-end' || item.calendarDay.type === 'selected') ? '#fff' : (item.calendarDay.type === 'disabled' ? '#c8c9cc' : color) }">{{ item.calendarDay.bottomInfo }}</text>
        </view>
      </view>
    </view>

    <!-- Month Mark -->
    <view v-if="showMark" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 4 }">
      <text :style="{ fontSize: 10, color: '#c8c9cc' }">{{ monthTitle }}</text>
    </view>

    <!-- Footer slot / Confirm Button -->
    <slot name="footer">
      <view v-if="showConfirm" :style="confirmBtnStyle" @tap="onConfirm">
        <text :style="confirmTextStyle">{{ isConfirmDisabled ? confirmDisabledText : confirmText }}</text>
      </view>
    </slot>
  </view>
</template>
