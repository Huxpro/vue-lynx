<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import Stepper from '../components/Stepper/index.vue';

const stepper1 = ref(1);
const stepper2 = ref(1);
const stepper3 = ref(1);
const stepper4 = ref(1);
const stepper5 = ref(1);
const disabledInput = ref(1);
const stepper7 = ref(1);
const stepper8 = ref(1);
const stepperRound = ref(1);

const beforeChange = () => {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
};
</script>

<template>
  <DemoPage title="Stepper">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <Cell center title="基础用法">
        <template #value>
          <Stepper v-model="stepper1" />
        </template>
      </Cell>

      <!-- 步长设置 -->
      <Cell center title="步长设置">
        <template #value>
          <Stepper v-model="stepper2" :step="2" />
        </template>
      </Cell>

      <!-- 限制输入范围 -->
      <Cell center title="限制输入范围">
        <template #value>
          <Stepper v-model="stepper3" :min="5" :max="8" />
        </template>
      </Cell>

      <!-- 限制输入整数 -->
      <Cell center title="限制输入整数">
        <template #value>
          <Stepper v-model="stepper4" integer />
        </template>
      </Cell>

      <!-- 禁用状态 -->
      <Cell center title="禁用状态">
        <template #value>
          <Stepper v-model="stepper5" disabled />
        </template>
      </Cell>

      <!-- 禁用输入框 -->
      <Cell center title="禁用输入框">
        <template #value>
          <Stepper v-model="disabledInput" disable-input />
        </template>
      </Cell>

      <!-- 固定小数位数 -->
      <Cell center title="固定小数位数">
        <template #value>
          <Stepper v-model="stepper8" :decimal-length="1" :step="0.2" />
        </template>
      </Cell>

      <!-- 自定义大小 -->
      <Cell center title="自定义大小">
        <template #value>
          <Stepper v-model="stepper7" button-size="32px" input-width="40px" />
        </template>
      </Cell>

      <!-- 异步变更 -->
      <Cell center title="异步变更">
        <template #value>
          <Stepper v-model="stepper7" :before-change="beforeChange" />
        </template>
      </Cell>

      <!-- 圆角风格 -->
      <Cell center title="圆角风格">
        <template #value>
          <Stepper
            v-model="stepperRound"
            theme="round"
            button-size="22"
            disable-input
          />
        </template>
      </Cell>
    </view>
  </DemoPage>
</template>
