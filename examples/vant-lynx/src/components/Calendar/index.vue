<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface CalendarProps {
  type?: 'single' | 'range' | 'multiple';
  title?: string;
  color?: string;
  minDate?: Date;
  maxDate?: Date;
  defaultDate?: Date | Date[];
  rowHeight?: number;
  poppable?: boolean;
  showMark?: boolean;
  showTitle?: boolean;
  showConfirm?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<CalendarProps>(), {
  type: 'single',
  title: 'Calendar',
  color: '#1989fa',
  rowHeight: 64,
  poppable: false,
  showMark: true,
  showTitle: true,
  showConfirm: true,
  readonly: false,
});

const emit = defineEmits<{
  select: [date: Date | Date[]];
  confirm: [date: Date | Date[]];
  open: [];
  close: [];
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

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthTitle = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ day: number; date: Date | null; isCurrentMonth: boolean }> = [];

  // Fill leading empty slots
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, date: null, isCurrentMonth: false });
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  return days;
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

function selectDate(date: Date | null) {
  if (!date || props.readonly || isDateDisabled(date)) return;

  if (props.type === 'single') {
    selectedDates.value = [date];
    emit('select', date);
  } else if (props.type === 'multiple') {
    const idx = selectedDates.value.findIndex((d) => isSameDay(d, date));
    if (idx >= 0) {
      selectedDates.value.splice(idx, 1);
    } else {
      selectedDates.value.push(date);
    }
    emit('select', [...selectedDates.value]);
  } else if (props.type === 'range') {
    if (selectedDates.value.length === 0 || selectedDates.value.length === 2) {
      selectedDates.value = [date];
    } else {
      const start = selectedDates.value[0];
      if (date < start) {
        selectedDates.value = [date];
      } else {
        selectedDates.value = [start, date];
      }
    }
    emit('select', [...selectedDates.value]);
  }
}

function onConfirm() {
  if (props.type === 'single' && selectedDates.value.length === 1) {
    emit('confirm', selectedDates.value[0]);
  } else {
    emit('confirm', [...selectedDates.value]);
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

function getDayStyle(item: { day: number; date: Date | null; isCurrentMonth: boolean }) {
  const base: Record<string, any> = {
    width: `${100 / 7}%`,
    height: props.rowHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!item.date || !item.isCurrentMonth) {
    return base;
  }

  if (isDateSelected(item.date)) {
    base.backgroundColor = props.color;
    base.borderRadius = props.rowHeight / 2;
  } else if (isInRange(item.date)) {
    base.backgroundColor = `${props.color}33`;
  }

  return base;
}

function getDayTextStyle(item: { day: number; date: Date | null; isCurrentMonth: boolean }) {
  const base: Record<string, any> = {
    fontSize: 16,
    color: '#323233',
    textAlign: 'center' as const,
  };

  if (!item.date) {
    base.color = 'transparent';
    return base;
  }

  if (isDateDisabled(item.date)) {
    base.color = '#c8c9cc';
    return base;
  }

  if (isDateSelected(item.date)) {
    base.color = '#fff';
    base.fontWeight = 'bold';
  } else if (isToday(item.date)) {
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
  backgroundColor: props.color,
  marginLeft: 16,
  marginRight: 16,
  marginBottom: 16,
  borderRadius: 24,
}));
</script>

<template>
  <view :style="containerStyle">
    <!-- Title -->
    <view v-if="showTitle" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12 }">
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
    </view>

    <!-- Month Navigation -->
    <view :style="headerStyle">
      <text :style="{ fontSize: 16, color: color, padding: 4 }" @tap="prevMonth">&lt;</text>
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ monthTitle }}</text>
      <text :style="{ fontSize: 16, color: color, padding: 4 }" @tap="nextMonth">&gt;</text>
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
        <view v-if="item.day > 0" :style="{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }">
          <text :style="getDayTextStyle(item)">{{ item.day }}</text>
          <text v-if="item.date && isToday(item.date) && !isDateSelected(item.date)" :style="{ fontSize: 10, color: color }">Today</text>
          <text v-if="item.date && isRangeStart(item.date)" :style="{ fontSize: 10, color: '#fff' }">Start</text>
          <text v-if="item.date && isRangeEnd(item.date)" :style="{ fontSize: 10, color: '#fff' }">End</text>
        </view>
      </view>
    </view>

    <!-- Month Mark -->
    <view v-if="showMark" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 4 }">
      <text :style="{ fontSize: 10, color: '#c8c9cc' }">{{ monthTitle }}</text>
    </view>

    <!-- Confirm Button -->
    <view v-if="showConfirm" :style="confirmBtnStyle" @tap="onConfirm">
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">Confirm</text>
    </view>
  </view>
</template>
