<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CheckboxGroup from '../components/CheckboxGroup/index.vue';
import Checkbox from '../components/Checkbox/index.vue';

const basicValue = ref(['a']);
const maxValue = ref(['a']);
const horizontalValue = ref<string[]>([]);
const toggleAllValue = ref<string[]>([]);
const allItems = ['a', 'b', 'c'];

function onToggleAll() {
  if (toggleAllValue.value.length === allItems.length) {
    toggleAllValue.value = [];
  } else {
    toggleAllValue.value = [...allItems];
  }
}
</script>

<template>
  <DemoPage title="CheckboxGroup">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="basicValue">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
          <Checkbox name="c"><text :style="{ fontSize: 14 }">Checkbox c</text></Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ basicValue.join(', ') }}</text>
      </view>

      <!-- Max Count -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Maximum 2 (max)</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="maxValue" :max="2">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
          <Checkbox name="c"><text :style="{ fontSize: 14 }">Checkbox c</text></Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ maxValue.join(', ') }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal Direction</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="horizontalValue" direction="horizontal">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
          <Checkbox name="c"><text :style="{ fontSize: 14 }">Checkbox c</text></Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Toggle All -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toggle All</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="toggleAllValue">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
          <Checkbox name="c"><text :style="{ fontSize: 14 }">Checkbox c</text></Checkbox>
        </CheckboxGroup>
        <view
          :style="{
            marginTop: 12,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 16,
            paddingRight: 16,
            backgroundColor: '#1989fa',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
          @tap="onToggleAll"
        >
          <text :style="{ color: '#fff', fontSize: 14 }">Toggle All</text>
        </view>
      </view>

      <!-- Custom Shape -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Square Shape</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="basicValue" shape="square">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Custom Checked Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Checked Color</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup v-model="basicValue" checked-color="#ee0a24">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Disabled Group -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Group</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <CheckboxGroup :model-value="['a']" :disabled="true">
          <Checkbox name="a"><text :style="{ fontSize: 14 }">Checkbox a</text></Checkbox>
          <Checkbox name="b"><text :style="{ fontSize: 14 }">Checkbox b</text></Checkbox>
        </CheckboxGroup>
      </view>
    </view>
  </DemoPage>
</template>
