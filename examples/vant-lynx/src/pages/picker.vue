<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Picker from '../components/Picker/index.vue';
import Popup from '../components/Popup/index.vue';
import Button from '../components/Button/index.vue';

const cityColumns = [['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']];
const cityResult = ref('');

const dateColumns = [
  ['2022', '2023', '2024', '2025'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
];
const dateResult = ref('');

const disabledColumns = [['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']];

const showPopupPicker = ref(false);
const popupResult = ref('');

function onCityConfirm(params: { selectedValues: (string | number)[]; selectedOptions: any[]; selectedIndexes: number[] }) {
  cityResult.value = params.selectedValues.join(', ');
}

function onDateConfirm(params: { selectedValues: (string | number)[]; selectedOptions: any[]; selectedIndexes: number[] }) {
  dateResult.value = params.selectedValues.join(' ');
}

function onPopupConfirm(params: { selectedValues: (string | number)[]; selectedOptions: any[]; selectedIndexes: number[] }) {
  popupResult.value = params.selectedValues.join(', ');
  showPopupPicker.value = false;
}

function onPopupCancel() {
  showPopupPicker.value = false;
}
</script>

<template>
  <DemoPage title="Picker">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Select City"
          :columns="cityColumns"
          @confirm="onCityConfirm"
        />
      </view>
      <view v-if="cityResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ cityResult }}</text>
      </view>

      <!-- Default Index -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Default Index</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Default 3rd"
          :columns="cityColumns"
          :model-value="['Guangzhou']"
        />
      </view>

      <!-- Multiple Columns -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Multiple Columns</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Select Date"
          :columns="dateColumns"
          @confirm="onDateConfirm"
        />
      </view>
      <view v-if="dateResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ dateResult }}</text>
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading State</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Loading..."
          :columns="cityColumns"
          :loading="true"
        />
      </view>

      <!-- Readonly -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Readonly</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Readonly"
          :columns="cityColumns"
          :readonly="true"
        />
      </view>

      <!-- With Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Popup</text>
      <view :style="{ marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showPopupPicker = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Picker</text>
        </Button>
      </view>
      <view v-if="popupResult" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ popupResult }}</text>
      </view>
    </view>

    <Popup v-model:show="showPopupPicker" position="bottom" round>
      <Picker
        title="Select City"
        :columns="cityColumns"
        @confirm="onPopupConfirm"
        @cancel="onPopupCancel"
      />
    </Popup>
  </DemoPage>
</template>
