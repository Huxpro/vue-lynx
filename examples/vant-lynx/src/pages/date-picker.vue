<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DatePicker from '../components/DatePicker/index.vue';

const dateValue = ref<string[]>([]);
const yearMonthValue = ref<string[]>([]);
const monthDayValue = ref<string[]>([]);
const datehourValue = ref<string[]>([]);

const dateResult = ref('');
const yearMonthResult = ref('');
const monthDayResult = ref('');
const datehourResult = ref('');

function onDateConfirm(val: string[]) {
  dateResult.value = val.join('-');
}

function onYearMonthConfirm(val: string[]) {
  yearMonthResult.value = val.join('-');
}

function onMonthDayConfirm(val: string[]) {
  monthDayResult.value = val.join('-');
}

function onDatehourConfirm(val: string[]) {
  datehourResult.value = `${val[0]}-${val[1]}-${val[2]} ${val[3]}:00`;
}
</script>

<template>
  <DemoPage title="DatePicker">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Choose Date -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Choose Date</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="dateValue"
          title="Select Date"
          @confirm="onDateConfirm"
        />
      </view>
      <view v-if="dateResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ dateResult }}</text>
      </view>

      <!-- Choose Year-Month -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Choose Year-Month</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="yearMonthValue"
          :columns-type="['year', 'month']"
          title="Year & Month"
          @confirm="onYearMonthConfirm"
        />
      </view>
      <view v-if="yearMonthResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ yearMonthResult }}</text>
      </view>

      <!-- Choose Month-Day -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Choose Month-Day</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="monthDayValue"
          :columns-type="['month', 'day']"
          title="Month & Day"
          @confirm="onMonthDayConfirm"
        />
      </view>
      <view v-if="monthDayResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ monthDayResult }}</text>
      </view>

      <!-- Choose Date + Hour -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Choose Time</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="datehourValue"
          :columns-type="['year', 'month', 'day', 'hour']"
          title="Date & Hour"
          @confirm="onDatehourConfirm"
        />
      </view>
      <view v-if="datehourResult" :style="{ marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ datehourResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
