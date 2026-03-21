<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import TimePicker from '../components/TimePicker/index.vue';
const timeValue = ref<string[]>([]);
const rangeValue = ref<string[]>([]);
const secondValue = ref<string[]>([]);

const timeResult = ref('');
const rangeResult = ref('');
const secondResult = ref('');

function onTimeConfirm(val: string[]) {
  timeResult.value = val.join(':');
}

function onRangeConfirm(val: string[]) {
  rangeResult.value = val.join(':');
}

function onSecondConfirm(val: string[]) {
  secondResult.value = val.join(':');
}
</script>

<template>
  <DemoPage title="TimePicker">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Time Picker -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Select Time (Hour / Minute)</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <TimePicker
          v-model="timeValue"
          title="Select Time"
          @confirm="onTimeConfirm"
        />
      </view>
      <view v-if="timeResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ timeResult }}</text>
      </view>

      <!-- Hour Range -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Limited Hour Range (09:00 — 18:00)</text>
      <view :style="{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }">
        <TimePicker
          v-model="rangeValue"
          title="Business Hours"
          :min-hour="9"
          :max-hour="18"
          :min-minute="0"
          :max-minute="59"
          @confirm="onRangeConfirm"
        />
      </view>
      <view v-if="rangeResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ rangeResult }}</text>
      </view>

      <!-- Hour / Minute / Second -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 8, marginBottom: 12 }">Hour / Minute / Second</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <TimePicker
          v-model="secondValue"
          :columns-type="['hour', 'minute', 'second']"
          title="Select Time"
          @confirm="onSecondConfirm"
        />
      </view>
      <view v-if="secondResult" :style="{ marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ secondResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
