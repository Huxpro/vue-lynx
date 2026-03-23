<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import SubmitBar from '../components/SubmitBar/index.vue';

const submitted = ref('');

function onSubmit() {
  submitted.value = 'Submitted';
}
</script>

<template>
  <DemoPage title="SubmitBar 提交订单栏">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <SubmitBar
          :price="3050"
          button-text="提交订单"
          @submit="onSubmit"
        />
      </view>

      <!-- 禁用状态 -->
      <text class="demo-section-title">禁用状态</text>
      <view :style="{ marginBottom: '16px' }">
        <SubmitBar
          :price="3050"
          button-text="提交订单"
          :disabled="true"
          tip="你的收货地址不支持配送，请修改地址后重试"
          tip-icon="info-o"
        />
      </view>

      <!-- 加载状态 -->
      <text class="demo-section-title">加载状态</text>
      <view :style="{ marginBottom: '16px' }">
        <SubmitBar
          :price="3050"
          button-text="提交订单"
          :loading="true"
        />
      </view>

      <!-- 高级用法 -->
      <text class="demo-section-title">高级用法</text>
      <view :style="{ marginBottom: '16px' }">
        <SubmitBar
          :price="3050"
          button-text="提交订单"
          @submit="onSubmit"
        >
          <template #tip>
            <text :style="{ fontSize: '12px', color: '#f56723' }">
              你的收货地址不支持配送，
            </text>
            <text :style="{ fontSize: '12px', color: '#1989fa' }" @tap="onSubmit">
              修改地址
            </text>
          </template>
        </SubmitBar>
      </view>
    </view>
  </DemoPage>
</template>
