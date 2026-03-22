<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Switch from '../components/Switch/index.vue';
import Cell from '../components/Cell/index.vue';
import Icon from '../components/Icon/index.vue';

const checked = ref(true);
const disabled = ref(true);
const loading = ref(true);
const loadingOff = ref(false);
const sizeChecked = ref(true);
const colorChecked = ref(true);
const nodeChecked = ref(true);
const asyncChecked = ref(true);
const cellChecked = ref(true);

function onAsyncChange() {
  // Simulate async control - just toggle for demo
  asyncChecked.value = !asyncChecked.value;
}
</script>

<template>
  <DemoPage title="Switch">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="checked" />
      </view>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用状态</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="disabled" disabled />
      </view>

      <!-- 加载状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">加载状态</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="loading" loading />
        <view :style="{ marginLeft: '16px' }">
          <Switch v-model="loadingOff" loading />
        </view>
      </view>

      <!-- 自定义大小 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义大小</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="sizeChecked" size="22px" />
      </view>

      <!-- 自定义颜色 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="colorChecked" active-color="#ee0a24" inactive-color="#dcdee0" />
      </view>

      <!-- 自定义按钮 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义按钮</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch v-model="nodeChecked">
          <template #node>
            <view :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }">
              <Icon :name="nodeChecked ? 'success' : 'cross'" :size="16" :color="nodeChecked ? '#1989fa' : '#ee0a24'" />
            </view>
          </template>
        </Switch>
      </view>

      <!-- 异步控制 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">异步控制</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Switch :model-value="asyncChecked" @update:model-value="onAsyncChange" />
      </view>

      <!-- 搭配单元格使用 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">搭配单元格使用</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Cell title="标题" center>
          <template #value>
            <Switch v-model="cellChecked" />
          </template>
        </Cell>
      </view>
    </view>
  </DemoPage>
</template>
