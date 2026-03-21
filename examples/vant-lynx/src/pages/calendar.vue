<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Calendar from '../components/Calendar/index.vue';
const selectedDate = ref('');
const rangeText = ref('');
const multiText = ref('');

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
</script>

<template>
  <DemoPage title="Calendar">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Single Selection -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Single Date Selection</text>
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
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Range Selection</text>
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
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Multiple Selection</text>
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
    </view>
  </DemoPage>
</template>
