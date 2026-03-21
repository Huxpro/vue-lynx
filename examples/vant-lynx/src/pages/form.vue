<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Form from '../components/Form/index.vue';
import Field from '../components/Field/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const username = ref('');
const password = ref('');
const phone = ref('');
const submitResult = ref('');
const formRef = ref<any>(null);

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
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Form</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Form -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Form</text>
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

      <!-- Submit Result -->
      <view v-if="submitResult" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ submitResult }}</text>
      </view>

      <!-- Disabled Form -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Disabled Form</text>
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
  </view>
</template>
