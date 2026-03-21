<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Checkbox from '../components/Checkbox/index.vue';
import CheckboxGroup from '../components/CheckboxGroup/index.vue';
const basicChecked = ref(true);
const groupValue = ref(['a', 'b']);
const disabledGroupValue = ref(['a']);
const maxGroupValue = ref(['a']);
const horizontalGroupValue = ref(['a']);
</script>

<template>
  <DemoPage title="Checkbox">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Checkbox v-model="basicChecked">
          <text :style="{ fontSize: 14, color: '#323233' }">Checkbox</text>
        </Checkbox>
      </view>

      <!-- Checkbox Group -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Checkbox Group</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="groupValue">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ groupValue.join(', ') }}</text>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="disabledGroupValue" disabled>
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#969799' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#969799' }">Checkbox b</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Maximum Count -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Maximum Count (max: 2)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="maxGroupValue" :max="2">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ maxGroupValue.join(', ') }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal Direction</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="horizontalGroupValue" direction="horizontal">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
      </view>
    </view>
  </DemoPage>
</template>
