<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cascader from '../components/Cascader/index.vue';

const selectedValue = ref<string | number>('');
const selectedText = ref('');
const colorValue = ref<string | number>('');
const asyncValue = ref<string | number>('');
const fieldValue = ref<string | number>('');
const fieldText = ref('');

const options = [
  {
    text: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        text: 'Hangzhou',
        value: 'hangzhou',
        children: [
          { text: 'West Lake', value: 'westlake' },
          { text: 'Xiaoshan', value: 'xiaoshan' },
        ],
      },
      {
        text: 'Wenzhou',
        value: 'wenzhou',
        children: [
          { text: 'Lucheng', value: 'lucheng' },
          { text: 'Longwan', value: 'longwan' },
        ],
      },
    ],
  },
  {
    text: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        text: 'Nanjing',
        value: 'nanjing',
        children: [
          { text: 'Gulou', value: 'gulou' },
          { text: 'Xuanwu', value: 'xuanwu' },
        ],
      },
      {
        text: 'Suzhou',
        value: 'suzhou',
        children: [
          { text: 'Gusu', value: 'gusu' },
          { text: 'Wuzhong', value: 'wuzhong' },
        ],
      },
    ],
  },
];

// Custom field names: uses name/code/items instead of text/value/children
const fieldOptions = [
  {
    name: 'Zhejiang',
    code: 'ZJ',
    items: [
      {
        name: 'Hangzhou',
        code: 'HZ',
        items: [
          { name: 'West Lake', code: 'WL' },
          { name: 'Xiaoshan', code: 'XS' },
        ],
      },
      {
        name: 'Wenzhou',
        code: 'WZ',
        items: [
          { name: 'Lucheng', code: 'LC' },
        ],
      },
    ],
  },
  {
    name: 'Jiangsu',
    code: 'JS',
    items: [
      {
        name: 'Nanjing',
        code: 'NJ',
        items: [
          { name: 'Gulou', code: 'GL' },
        ],
      },
    ],
  },
];

// Async options: initial top-level, children loaded on demand
const asyncOptions = ref([
  { text: 'Zhejiang', value: 'zhejiang' },
  { text: 'Jiangsu', value: 'jiangsu' },
]);

function onAsyncChange(payload: { value: string | number; text: string; selectedOptions: any[] }) {
  const selected = payload.selectedOptions[payload.selectedOptions.length - 1];
  if (selected && !selected.children) {
    // Simulate async load
    const childMap: Record<string, any[]> = {
      zhejiang: [
        { text: 'Hangzhou', value: 'hangzhou', children: [{ text: 'West Lake', value: 'westlake' }] },
        { text: 'Wenzhou', value: 'wenzhou', children: [{ text: 'Lucheng', value: 'lucheng' }] },
      ],
      jiangsu: [
        { text: 'Nanjing', value: 'nanjing', children: [{ text: 'Gulou', value: 'gulou' }] },
        { text: 'Suzhou', value: 'suzhou', children: [{ text: 'Gusu', value: 'gusu' }] },
      ],
      hangzhou: [{ text: 'West Lake', value: 'westlake' }],
      wenzhou: [{ text: 'Lucheng', value: 'lucheng' }],
      nanjing: [{ text: 'Gulou', value: 'gulou' }],
      suzhou: [{ text: 'Gusu', value: 'gusu' }],
    };
    const children = childMap[String(payload.value)];
    if (children) {
      selected.children = children;
      asyncOptions.value = [...asyncOptions.value];
    }
  }
}

function onFinish(payload: { value: string | number; text: string; selectedOptions: any[] }) {
  selectedValue.value = payload.value;
  selectedText.value = payload.selectedOptions.map((o: any) => o.text).join(' / ');
}

function onFieldFinish(payload: { value: string | number; text: string; selectedOptions: any[] }) {
  fieldValue.value = payload.value;
  fieldText.value = payload.selectedOptions.map((o: any) => o.name).join(' / ');
}
</script>

<template>
  <DemoPage title="Cascader">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view v-if="selectedText" :style="{ marginBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">Selected: {{ selectedText }}</text>
      </view>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Cascader
          v-model="selectedValue"
          title="Select Area"
          :options="options"
          :closeable="false"
          @finish="onFinish"
        />
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Cascader
          v-model="colorValue"
          title="Select Area"
          :options="options"
          :closeable="false"
          active-color="#ee0a24"
        />
      </view>

      <!-- Async Options -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Async Options</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Cascader
          v-model="asyncValue"
          title="Select Area"
          :options="asyncOptions"
          :closeable="false"
          @change="onAsyncChange"
        />
      </view>

      <!-- Custom Field Names -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Field Names</text>
      <view v-if="fieldText" :style="{ marginBottom: 8 }">
        <text :style="{ fontSize: 13, color: '#323233' }">Selected: {{ fieldText }}</text>
      </view>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <Cascader
          v-model="fieldValue"
          title="Select Area"
          :options="fieldOptions"
          :field-names="{ text: 'name', value: 'code', children: 'items' }"
          :closeable="false"
          @finish="onFieldFinish"
        />
      </view>
    </view>
  </DemoPage>
</template>
