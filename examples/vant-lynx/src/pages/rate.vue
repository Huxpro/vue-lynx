<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Rate from '../components/Rate/index.vue';

const value1 = ref(3);
const value2 = ref(3);
const value3 = ref(3);
const value4 = ref(2.5);
const value5 = ref(4);
const value6 = ref(3);
const value7 = ref(3.3);
const value8 = ref(2);
const value9 = ref(3);
</script>

<template>
  <DemoPage title="Rate 评分">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value1" />
      </view>

      <!-- 自定义图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义图标</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value2" icon="like" void-icon="like-o" />
      </view>

      <!-- 自定义样式 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义样式</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate
          v-model="value3"
          :size="25"
          color="#ffd21e"
          void-icon="star"
          void-color="#eee"
        />
      </view>

      <!-- 半星 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">半星</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value4" allow-half />
      </view>

      <!-- 自定义数量 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义数量</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value5" :count="6" />
      </view>

      <!-- 可清空 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">可清空</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value9" clearable />
      </view>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用状态</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value6" disabled />
      </view>

      <!-- 只读状态 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">只读状态</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value6" readonly />
      </view>

      <!-- 只读状态小数显示 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">只读状态小数显示</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value7" readonly allow-half />
      </view>

      <!-- 监听 change 事件 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">监听 change 事件</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <Rate v-model="value8" />
      </view>
    </view>
  </DemoPage>
</template>
