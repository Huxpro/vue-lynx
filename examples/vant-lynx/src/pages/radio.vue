<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Radio from '../components/Radio/index.vue';
import RadioGroup from '../components/RadioGroup/index.vue';
const basicValue = ref('1');
const horizontalValue = ref('1');
const disabledValue = ref('1');
const shapeSquareValue = ref('1');
const shapeDotValue = ref('1');
const labelLeftValue = ref('1');
const labelDisabledValue = ref('1');
const customColorValue = ref('1');
const customSizeValue = ref('1');
const customIconValue = ref('1');
const groupOverrideValue = ref('1');
</script>

<template>
  <DemoPage title="Radio">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="basicValue">
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ basicValue }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal Direction</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="horizontalValue" direction="horizontal">
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
          <Radio name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 3</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="disabledValue" disabled>
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#969799' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#969799' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Square Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Square Shape</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="shapeSquareValue">
          <Radio name="1" shape="square">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" shape="square">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Dot Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dot Shape</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="shapeDotValue">
          <Radio name="1" shape="dot">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" shape="dot">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Label Position Left -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Label Position Left</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="labelLeftValue">
          <Radio name="1" label-position="left">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" label-position="left">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Label Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Label Disabled (only icon is clickable)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="labelDisabledValue">
          <Radio name="1" label-disabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" label-disabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="customColorValue">
          <Radio name="1" checked-color="#ee0a24">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" checked-color="#ee0a24">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Custom Icon Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="customSizeValue">
          <Radio name="1" :icon-size="28">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2" :icon-size="28">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Custom Icon Slot -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon Slot</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="customIconValue">
          <Radio name="1">
            <template #icon="{ checked }">
              <text :style="{ fontSize: 20, color: checked ? '#1989fa' : '#c8c9cc' }">{{ checked ? '◉' : '○' }}</text>
            </template>
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <template #icon="{ checked }">
              <text :style="{ fontSize: 20, color: checked ? '#1989fa' : '#c8c9cc' }">{{ checked ? '◉' : '○' }}</text>
            </template>
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Group-Level Overrides -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Group-Level Shape, Size, Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="groupOverrideValue" shape="dot" :icon-size="24" checked-color="#07c160">
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
          <Radio name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 3</text>
          </Radio>
        </RadioGroup>
      </view>
    </view>
  </DemoPage>
</template>
