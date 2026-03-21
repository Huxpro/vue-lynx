<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Calendar from '../components/Calendar/index.vue';
import type { CalendarDay } from '../components/Calendar/index.vue';

const selectedDate = ref('');
const rangeText = ref('');
const multiText = ref('');
const quickText = ref('');

const today = new Date();
const customMinDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const customMaxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

function onSingleSelect(date: Date) {
  selectedDate.value = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function onSingleConfirm(date: Date) {
  selectedDate.value = `Confirmed: ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function onRangeSelect(dates: Date[]) {
  if (dates.length === 2) {
    const start = dates[0];
    const end = dates[1];
    rangeText.value = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  } else if (dates.length === 1) {
    const d = dates[0];
    rangeText.value = `Start: ${d.getMonth() + 1}/${d.getDate()}`;
  }
}

function onMultipleSelect(dates: Date[]) {
  multiText.value = `${dates.length} dates selected`;
}

function onQuickConfirm(date: Date) {
  quickText.value = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function dayFormatter(day: CalendarDay): CalendarDay {
  const date = day.date;
  if (date.getDay() === 6 || date.getDay() === 0) {
    day.topInfo = 'Weekend';
  }
  return day;
}
</script>

<template>
  <DemoPage title="Calendar">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Select Switch Mode -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Select Switch Mode</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Month/Year Switch"
          switch-mode="month"
          :show-confirm="false"
        />
      </view>

      <!-- Single Selection -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Select Single Date</text>
      <view v-if="selectedDate" :style="{ paddingLeft: 12, paddingBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">{{ selectedDate }}</text>
      </view>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Select Date"
          @select="onSingleSelect"
          @confirm="onSingleConfirm"
        />
      </view>

      <!-- Range Selection -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Select Date Range</text>
      <view v-if="rangeText" :style="{ paddingLeft: 12, paddingBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">{{ rangeText }}</text>
      </view>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="range"
          title="Select Range"
          color="#ee0a24"
          :show-confirm="false"
          @select="onRangeSelect"
        />
      </view>

      <!-- Multiple Selection -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Select Multiple Date</text>
      <view v-if="multiText" :style="{ paddingLeft: 12, paddingBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">{{ multiText }}</text>
      </view>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="multiple"
          title="Select Dates"
          color="#07c160"
          :show-confirm="false"
          @select="onMultipleSelect"
        />
      </view>

      <!-- Quick Select -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Quick Select</text>
      <view v-if="quickText" :style="{ paddingLeft: 12, paddingBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">{{ quickText }}</text>
      </view>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Quick Select"
          :show-confirm="false"
          @confirm="onQuickConfirm"
        />
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Color</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Custom Color"
          color="#ff6034"
          :show-confirm="false"
        />
      </view>

      <!-- Custom Date Range -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Date Range</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Custom Range"
          :min-date="customMinDate"
          :max-date="customMaxDate"
          :show-confirm="false"
        />
      </view>

      <!-- Custom Confirm Text -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Confirm Text</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="range"
          title="Select Trip"
          confirm-text="Done"
          confirm-disabled-text="Select End Date"
        />
      </view>

      <!-- Custom Day Text -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Day Text</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Weekend Labels"
          :formatter="dayFormatter"
          :show-confirm="false"
        />
      </view>

      <!-- Custom First Day Of Week -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom First Day Of Week</text>
      <view :style="{ margin: 12, marginTop: 0 }">
        <Calendar
          type="single"
          title="Week starts Monday"
          :first-day-of-week="1"
          :show-confirm="false"
        />
      </view>
    </view>
  </DemoPage>
</template>
