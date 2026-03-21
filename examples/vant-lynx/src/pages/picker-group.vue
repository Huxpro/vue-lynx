<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PickerGroup from '../components/PickerGroup/index.vue';
import Picker from '../components/Picker/index.vue';

const activeTab = ref(0);

const cityColumns = [
  { text: 'Hangzhou', value: 'hangzhou' },
  { text: 'Ningbo', value: 'ningbo' },
  { text: 'Wenzhou', value: 'wenzhou' },
  { text: 'Shaoxing', value: 'shaoxing' },
  { text: 'Jinhua', value: 'jinhua' },
];

const dateColumns = [
  [
    { text: '2023', value: '2023' },
    { text: '2024', value: '2024' },
    { text: '2025', value: '2025' },
  ],
  [
    { text: 'Jan', value: '01' },
    { text: 'Feb', value: '02' },
    { text: 'Mar', value: '03' },
    { text: 'Apr', value: '04' },
    { text: 'May', value: '05' },
    { text: 'Jun', value: '06' },
  ],
  [
    { text: '1', value: '1' },
    { text: '5', value: '5' },
    { text: '10', value: '10' },
    { text: '15', value: '15' },
    { text: '20', value: '20' },
    { text: '25', value: '25' },
  ],
];

const cityValue = ref(['hangzhou']);
const dateValue = ref(['2024', '01', '1']);

function onConfirm(values: any[]) {
  console.log('Confirmed:', values);
}

function onCancel() {
  console.log('Cancelled');
}
</script>

<template>
  <DemoPage title="PickerGroup">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage with Tabs -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage with Tabs</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PickerGroup
          title="Select City & Date"
          :tabs="['City', 'Date']"
          v-model:active-tab="activeTab"
          next-step-text="Next Step"
          @confirm="onConfirm"
          @cancel="onCancel"
        >
          <Picker
            v-show="activeTab === 0"
            v-model="cityValue"
            :columns="cityColumns"
            :show-toolbar="false"
          />
          <Picker
            v-show="activeTab === 1"
            v-model="dateValue"
            :columns="dateColumns"
            :show-toolbar="false"
          />
        </PickerGroup>
      </view>

      <!-- Without Tabs (Single Picker) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Single Picker in Group</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PickerGroup
          title="Select City"
          @confirm="onConfirm"
          @cancel="onCancel"
        >
          <Picker
            v-model="cityValue"
            :columns="cityColumns"
            :show-toolbar="false"
          />
        </PickerGroup>
      </view>

      <!-- Custom Button Text -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Button Text</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PickerGroup
          title="Custom Buttons"
          confirm-button-text="OK"
          cancel-button-text="Back"
          @confirm="onConfirm"
          @cancel="onCancel"
        >
          <Picker
            v-model="cityValue"
            :columns="cityColumns"
            :show-toolbar="false"
          />
        </PickerGroup>
      </view>
    </view>
  </DemoPage>
</template>
