<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Field from '../components/Field/index.vue';
const basicValue = ref('');
const labelValue = ref('');
const passwordValue = ref('');
const telValue = ref('');
const numberValue = ref('');
const disabledValue = ref('Input Disabled');
const readonlyValue = ref('Input Readonly');
const errorValue = ref('');
const errorMsgValue = ref('');
const clearableValue = ref('Hello');
const requiredValue = ref('');
const leftIconValue = ref('');
const rightIconValue = ref('');
const wordLimitValue = ref('');
</script>

<template>
  <DemoPage title="Field">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="basicValue"
          placeholder="Please enter text"
        />
      </view>

      <!-- Custom Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Type</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="labelValue"
          label="Text"
          placeholder="Enter text"
        />
        <Field
          v-model="passwordValue"
          label="Password"
          type="password"
          placeholder="Enter password"
        />
        <Field
          v-model="telValue"
          label="Phone"
          type="tel"
          placeholder="Enter phone"
        />
        <Field
          v-model="numberValue"
          label="Number"
          type="number"
          placeholder="Enter number"
        />
      </view>

      <!-- Disabled & Readonly -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled & Readonly</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="disabledValue"
          label="Disabled"
          disabled
        />
        <Field
          v-model="readonlyValue"
          label="Readonly"
          readonly
        />
      </view>

      <!-- Show Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Icon</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="leftIconValue"
          label="Label"
          left-icon="smile-o"
          placeholder="Left Icon"
        />
        <Field
          v-model="rightIconValue"
          label="Label"
          right-icon="warning-o"
          placeholder="Right Icon"
        />
      </view>

      <!-- Error Info -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error Info</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="errorValue"
          label="Username"
          error
          placeholder="Please enter username"
        />
        <Field
          v-model="errorMsgValue"
          label="Phone"
          placeholder="Please enter phone"
          error-message="Invalid phone number"
        />
      </view>

      <!-- Clearable -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Clearable</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="clearableValue"
          label="Username"
          clearable
          placeholder="Please enter username"
        />
      </view>

      <!-- Required -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Required</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="requiredValue"
          label="Username"
          required
          placeholder="Please enter username"
        />
      </view>

      <!-- Word Limit -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Word Limit</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="wordLimitValue"
          label="Message"
          placeholder="Enter message"
          :maxlength="50"
          show-word-limit
        />
      </view>
    </view>
  </DemoPage>
</template>
