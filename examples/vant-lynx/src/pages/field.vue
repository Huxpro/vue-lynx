<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Field from '../components/Field/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const basicValue = ref('');
const labelValue = ref('');
const disabledValue = ref('Input Disabled');
const errorValue = ref('');
const clearableValue = ref('Hello');
const requiredValue = ref('');
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Field</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="basicValue"
          placeholder="Please enter text"
        />
      </view>

      <!-- With Label -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Label</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="labelValue"
          label="Username"
          placeholder="Please enter username"
        />
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="disabledValue"
          label="Username"
          disabled
          placeholder="Disabled input"
        />
      </view>

      <!-- Error -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="errorValue"
          label="Username"
          error
          placeholder="Please enter username"
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
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <Field
          v-model="requiredValue"
          label="Username"
          required
          placeholder="Please enter username"
        />
      </view>
    </view>
  </view>
</template>
