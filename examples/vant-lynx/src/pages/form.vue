<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Form from '../components/Form/index.vue';
import Field from '../components/Field/index.vue';
import Switch from '../components/Switch/index.vue';
import Checkbox from '../components/Checkbox/index.vue';
import Stepper from '../components/Stepper/index.vue';
import Rate from '../components/Rate/index.vue';
import Slider from '../components/Slider/index.vue';

const username = ref('');
const password = ref('');
const phone = ref('');
const submitResult = ref('');
const formRef = ref<any>(null);

// Validate form
const valUsername = ref('');
const valPhone = ref('');
const valCode = ref('');
const valResult = ref('');
const valFormRef = ref<any>(null);

// Field type form
const switchValue = ref(false);
const checkboxValue = ref(false);
const stepperValue = ref(1);
const rateValue = ref(3);
const sliderValue = ref(50);

function onSubmit(values: Record<string, any>) {
  submitResult.value = `Submitted: username=${username.value}, phone=${phone.value}`;
}

function onFailed(errorInfo: any) {
  submitResult.value = 'Validation failed';
}

function handleSubmit() {
  if (formRef.value) {
    formRef.value.submit();
  }
}

function handleReset() {
  username.value = '';
  password.value = '';
  phone.value = '';
  submitResult.value = '';
  if (formRef.value) {
    formRef.value.resetValidation();
  }
}

function onValSubmit(values: Record<string, any>) {
  valResult.value = `Validation passed: ${JSON.stringify(values)}`;
}

function onValFailed(errorInfo: any) {
  valResult.value = 'Validation failed';
}

function handleValSubmit() {
  if (valFormRef.value) {
    valFormRef.value.submit();
  }
}
</script>

<template>
  <DemoPage title="Form">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Form ref="formRef" label-width="80" colon @submit="onSubmit" @failed="onFailed">
          <Field
            v-model="username"
            label="Username"
            placeholder="Enter username"
            required
          />
          <Field
            v-model="password"
            label="Password"
            type="password"
            placeholder="Enter password"
            required
          />
          <Field
            v-model="phone"
            label="Phone"
            type="tel"
            placeholder="Enter phone number"
          />
          <template #footer>
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }">
              <view
                :style="{ backgroundColor: '#1989fa', borderRadius: 24, height: 44, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }"
                @tap="handleSubmit"
              >
                <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">Submit</text>
              </view>
              <view
                :style="{ backgroundColor: '#fff', borderRadius: 24, height: 44, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'solid', borderColor: '#ebedf0' }"
                @tap="handleReset"
              >
                <text :style="{ fontSize: 16, color: '#323233', fontWeight: 'bold' }">Reset</text>
              </view>
            </view>
          </template>
        </Form>
      </view>
      <view v-if="submitResult" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ submitResult }}</text>
      </view>

      <!-- Validate Rules -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Validate Rules</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Form ref="valFormRef" label-width="80" colon @submit="onValSubmit" @failed="onValFailed">
          <Field
            v-model="valUsername"
            label="Username"
            placeholder="Enter username"
            required
            :rules="[{ required: true, message: 'Username is required' }]"
          />
          <Field
            v-model="valPhone"
            label="Phone"
            type="tel"
            placeholder="Enter phone"
            :rules="[{ required: true, message: 'Phone is required' }]"
          />
          <Field
            v-model="valCode"
            label="Code"
            placeholder="Enter code"
            :rules="[{ required: true, message: 'Code is required' }]"
          />
          <template #footer>
            <view
              :style="{ backgroundColor: '#1989fa', borderRadius: 24, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
              @tap="handleValSubmit"
            >
              <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">Submit</text>
            </view>
          </template>
        </Form>
      </view>
      <view v-if="valResult" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ valResult }}</text>
      </view>

      <!-- Field Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Field Type</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <view :style="{ backgroundColor: '#fff', padding: 16, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Switch</text>
          <Switch v-model="switchValue" />
        </view>
        <view :style="{ backgroundColor: '#fff', padding: 16, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Checkbox</text>
          <Checkbox v-model="checkboxValue" />
        </view>
        <view :style="{ backgroundColor: '#fff', padding: 16, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Stepper</text>
          <Stepper v-model="stepperValue" />
        </view>
        <view :style="{ backgroundColor: '#fff', padding: 16, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Rate</text>
          <Rate v-model="rateValue" />
        </view>
        <view :style="{ backgroundColor: '#fff', padding: 16, display: 'flex', flexDirection: 'column', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
          <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">Slider</text>
          <Slider v-model="sliderValue" />
        </view>
      </view>

      <!-- Disabled Form -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Form</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <Form disabled>
          <Field
            model-value="disabled value"
            label="Field"
            disabled
          />
        </Form>
      </view>
    </view>
  </DemoPage>
</template>
