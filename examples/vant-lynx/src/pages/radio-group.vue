<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import RadioGroup from '../components/RadioGroup/index.vue';
import Radio from '../components/Radio/index.vue';

const basicValue = ref('1');
const horizontalValue = ref('1');
const disabledValue = ref('1');
const shapeValue = ref('1');
const dotValue = ref('1');
const colorValue = ref('1');
</script>

<template>
  <DemoPage title="RadioGroup">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="basicValue">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
          <Radio name="3"><text :style="{ fontSize: 14 }">Radio 3</text></Radio>
        </RadioGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ basicValue }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal Direction</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="horizontalValue" direction="horizontal">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
          <Radio name="3"><text :style="{ fontSize: 14 }">Radio 3</text></Radio>
        </RadioGroup>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="disabledValue" :disabled="true">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
        </RadioGroup>
      </view>

      <!-- Square Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Square Shape</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="shapeValue" shape="square">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
        </RadioGroup>
      </view>

      <!-- Dot Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dot Shape</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="dotValue" shape="dot">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
        </RadioGroup>
      </view>

      <!-- Custom Checked Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Checked Color</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="colorValue" checked-color="#ee0a24">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
        </RadioGroup>
      </view>

      <!-- Custom Icon Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon Size</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="basicValue" :icon-size="24">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2"><text :style="{ fontSize: 14 }">Radio 2</text></Radio>
        </RadioGroup>
      </view>

      <!-- Individual Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Individual Disabled</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <RadioGroup v-model="basicValue">
          <Radio name="1"><text :style="{ fontSize: 14 }">Radio 1</text></Radio>
          <Radio name="2" :disabled="true"><text :style="{ fontSize: 14 }">Radio 2 (Disabled)</text></Radio>
          <Radio name="3"><text :style="{ fontSize: 14 }">Radio 3</text></Radio>
        </RadioGroup>
      </view>
    </view>
  </DemoPage>
</template>
