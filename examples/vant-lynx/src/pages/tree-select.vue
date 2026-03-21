<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import TreeSelect from '../components/TreeSelect/index.vue';
const items = [
  {
    text: 'Zhejiang',
    id: 'zj',
    children: [
      { text: 'Hangzhou', id: 'hz' },
      { text: 'Wenzhou', id: 'wz' },
      { text: 'Ningbo', id: 'nb' },
      { text: 'Shaoxing', id: 'sx' },
    ],
  },
  {
    text: 'Jiangsu',
    id: 'js',
    children: [
      { text: 'Nanjing', id: 'nj' },
      { text: 'Wuxi', id: 'wx' },
      { text: 'Xuzhou', id: 'xz' },
    ],
  },
  {
    text: 'Fujian',
    id: 'fj',
    children: [
      { text: 'Fuzhou', id: 'fz' },
      { text: 'Xiamen', id: 'xm' },
    ],
  },
];

// Single select
const activeId = ref('hz');
const mainActiveIndex = ref(0);

// Multi select
const multiActiveIds = ref<(string | number)[]>(['hz', 'nj']);
const multiMainActiveIndex = ref(0);
</script>

<template>
  <DemoPage title="TreeSelect">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Single Select -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Single Select</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <TreeSelect
          :items="items"
          v-model:active-id="activeId"
          v-model:main-active-index="mainActiveIndex"
        />
      </view>
      <view :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ activeId }}</text>
      </view>

      <!-- Multi Select -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Multi Select (max 3)</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <TreeSelect
          :items="items"
          v-model:active-id="multiActiveIds"
          v-model:main-active-index="multiMainActiveIndex"
          :max="3"
        />
      </view>
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ multiActiveIds.join(', ') }}</text>
      </view>
    </view>
  </DemoPage>
</template>
