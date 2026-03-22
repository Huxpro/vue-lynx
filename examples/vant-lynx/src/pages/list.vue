<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import List from '../components/List/index.vue';
import Cell from '../components/Cell/index.vue';

// Basic Usage
const loading1 = ref(false);
const finished1 = ref(false);
const items1 = ref<string[]>([]);

function onLoad1() {
  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      const text = items1.value.length + 1;
      items1.value.push(text < 10 ? '0' + text : String(text));
    }
    loading1.value = false;
    if (items1.value.length >= 40) {
      finished1.value = true;
    }
  }, 1000);
}

// Error Info
const loading2 = ref(false);
const finished2 = ref(false);
const error2 = ref(false);
const items2 = ref<string[]>([]);

function onLoad2() {
  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      const text = items2.value.length + 1;
      items2.value.push(text < 10 ? '0' + text : String(text));
    }
    loading2.value = false;

    // Show error after first batch
    if (items2.value.length === 10 && !error2.value) {
      error2.value = true;
    } else {
      error2.value = false;
    }

    if (items2.value.length >= 40) {
      finished2.value = true;
    }
  }, 1000);
}

// Finished Text
const loading3 = ref(false);
const finished3 = ref(false);
const items3 = ref<string[]>([]);

function onLoad3() {
  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      const text = items3.value.length + 1;
      items3.value.push(text < 10 ? '0' + text : String(text));
    }
    loading3.value = false;
    if (items3.value.length >= 20) {
      finished3.value = true;
    }
  }, 1000);
}
</script>

<template>
  <DemoPage title="List 列表">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">基础用法</text>
      <view :style="{ maxHeight: '300px', overflow: 'hidden' }">
        <List
          v-model:loading="loading1"
          :finished="finished1"
          finished-text="没有更多了"
          @load="onLoad1"
        >
          <Cell v-for="item in items1" :key="item" :title="item" />
        </List>
      </view>

      <!-- 错误提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">错误提示</text>
      <view :style="{ maxHeight: '300px', overflow: 'hidden' }">
        <List
          v-model:loading="loading2"
          v-model:error="error2"
          :finished="finished2"
          error-text="请求失败，点击重新加载"
          @load="onLoad2"
        >
          <Cell v-for="item in items2" :key="item" :title="item" />
        </List>
      </view>

      <!-- 完成提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">完成提示</text>
      <view :style="{ maxHeight: '300px', overflow: 'hidden' }">
        <List
          v-model:loading="loading3"
          :finished="finished3"
          finished-text="没有更多了"
          @load="onLoad3"
        >
          <Cell v-for="item in items3" :key="item" :title="item" />
        </List>
      </view>
    </view>
  </DemoPage>
</template>
