<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Form from '../components/Form/index.vue';
import Field from '../components/Field/index.vue';
import Button from '../components/Button/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Switch from '../components/Switch/index.vue';

// Basic Usage
const username = ref('');
const password = ref('');
const formRef = ref<any>(null);

const onSubmit = (values: Record<string, unknown>) => {
  console.log('submit', values);
};

const onFailed = (errorInfo: any) => {
  console.log('failed', errorInfo);
};

const handleSubmit = () => {
  if (formRef.value) {
    formRef.value.submit();
  }
};

// Validate Rules
const value1 = ref('');
const value2 = ref('');
const value3 = ref('abc');
const value4 = ref('');
const formRef2 = ref<any>(null);

const pattern = /\d{6}/;
const validator = (val: string) => /1\d{10}/.test(val);
const validatorMessage = (val: string) => `${val} 不合法，请重新输入`;
const asyncValidator = (val: string) =>
  new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(val === '1234');
    }, 1000);
  });

const handleSubmit2 = () => {
  if (formRef2.value) {
    formRef2.value.submit();
  }
};

// Field Type
const switchVal = ref(false);
const formRef3 = ref<any>(null);

const handleSubmit3 = () => {
  if (formRef3.value) {
    formRef3.value.submit();
  }
};
</script>

<template>
  <DemoPage title="Form 表单">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">基础用法</text>
      <Form ref="formRef" @submit="onSubmit" @failed="onFailed">
        <CellGroup inset>
          <Field
            v-model="username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <Field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </CellGroup>
        <view :style="{ margin: '16px', marginTop: '16px' }">
          <Button round block type="primary" @tap="handleSubmit">
            <text>提交</text>
          </Button>
        </view>
      </Form>

      <!-- 校验规则 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">校验规则</text>
      <Form ref="formRef2" @submit="onSubmit" @failed="onFailed">
        <CellGroup inset>
          <Field
            v-model="value1"
            name="pattern"
            label="文本"
            placeholder="正则校验"
            :rules="[{ pattern, message: '请输入正确内容' }]"
          />
          <Field
            v-model="value2"
            name="validator"
            label="文本"
            placeholder="函数校验"
            :rules="[{ validator, message: '请输入正确内容' }]"
          />
          <Field
            v-model="value3"
            name="validatorMessage"
            label="文本"
            placeholder="校验函数返回错误提示"
            :rules="[{ validator: validatorMessage }]"
          />
          <Field
            v-model="value4"
            name="asyncValidator"
            label="文本"
            placeholder="异步函数校验"
            :rules="[{ validator: asyncValidator, message: '请输入正确内容' }]"
          />
        </CellGroup>
        <view :style="{ margin: '16px', marginTop: '16px' }">
          <Button round block type="primary" @tap="handleSubmit2">
            <text>提交</text>
          </Button>
        </view>
      </Form>

      <!-- 表单项类型 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">表单项类型</text>
      <Form ref="formRef3" @submit="onSubmit">
        <CellGroup inset>
          <Field name="switch" label="开关">
            <template #input>
              <Switch v-model="switchVal" />
            </template>
          </Field>
        </CellGroup>
        <view :style="{ margin: '16px', marginTop: '16px' }">
          <Button round block type="primary" @tap="handleSubmit3">
            <text>提交</text>
          </Button>
        </view>
      </Form>
    </view>
  </DemoPage>
</template>
