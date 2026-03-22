<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Steps from '../components/Steps/index.vue';
import Step from '../components/Step/index.vue';

const active = ref(1);

const nextStep = () => {
  active.value = ++active.value % 4;
};
</script>

<template>
  <DemoPage title="Steps 步骤条">

    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <Steps :active="active">
          <Step>买家下单</Step>
          <Step>商家接单</Step>
          <Step>买家提货</Step>
          <Step>交易完成</Step>
        </Steps>
        <view :style="{ padding: '16px 16px 0' }">
          <text
            :style="{ fontSize: '14px', color: '#1989fa' }"
            @tap="nextStep"
          >下一步</text>
        </view>
      </view>

      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义样式</text>
      <view :style="{ marginBottom: '16px' }">
        <Steps
          :active="active"
          active-icon="success"
          inactive-icon="arrow"
          active-color="#07c160"
        >
          <Step>买家下单</Step>
          <Step>商家接单</Step>
          <Step>买家提货</Step>
          <Step>交易完成</Step>
        </Steps>
      </view>

      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">竖向步骤条</text>
      <view>
        <Steps :active="0" direction="vertical">
          <Step>
            <text :style="{ fontSize: '14px', fontWeight: 'bold' }">【城市】物流状态1</text>
            <text :style="{ fontSize: '12px', color: '#969799' }">2016-07-12 12:40</text>
          </Step>
          <Step>
            <text :style="{ fontSize: '14px', fontWeight: 'bold' }">【城市】物流状态</text>
            <text :style="{ fontSize: '12px', color: '#969799' }">2016-07-11 10:00</text>
          </Step>
          <Step>
            <text :style="{ fontSize: '14px', fontWeight: 'bold' }">快件已发货</text>
            <text :style="{ fontSize: '12px', color: '#969799' }">2016-07-10 09:30</text>
          </Step>
        </Steps>
      </view>
    </view>
  </DemoPage>
</template>
