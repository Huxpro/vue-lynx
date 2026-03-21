<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DatePicker from '../components/DatePicker/index.vue';
const dateValue = ref<string[]>([]);
const yearMonthValue = ref<string[]>([]);
const datehourValue = ref<string[]>([]);

const dateResult = ref('');
const yearMonthResult = ref('');
const datehourResult = ref('');

function onDateConfirm(val: string[]) {
  dateResult.value = val.join('-');
}

function onYearMonthConfirm(val: string[]) {
  yearMonthResult.value = val.join('-');
}

function onDatehourConfirm(val: string[]) {
  datehourResult.value = `${val[0]}-${val[1]}-${val[2]} ${val[3]}:00`;
}
</script>

<template>
  <DemoPage title="DatePicker">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Default Date Picker -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Select Date (Year / Month / Day)</text>
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

      <!-- Year Month Only -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Year / Month Only</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="yearMonthValue"
          type="year-month"
          title="Select Year & Month"
          @confirm="onYearMonthConfirm"
        />
      </view>
      <view v-if="yearMonthResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ yearMonthResult }}</text>
      </view>

      <!-- Date + Hour -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Date + Hour</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <DatePicker
          v-model="datehourValue"
          type="datehour"
          title="Select Date & Hour"
          @confirm="onDatehourConfirm"
        />
      </view>
      <view v-if="datehourResult" :style="{ marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ datehourResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
