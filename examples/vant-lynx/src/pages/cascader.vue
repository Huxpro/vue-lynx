<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Cascader from '../components/Cascader/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

const selectedValue = ref<string | number>('');
const selectedText = ref('');
const showCascader = ref(true);

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

function onFinish(payload: { value: string | number; text: string; selectedOptions: any[] }) {
  selectedValue.value = payload.value;
  selectedText.value = payload.selectedOptions.map((o: any) => o.text).join(' / ');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Cascader</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Result display -->
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Selected Value</text>
        <text :style="{ fontSize: 14, color: '#323233' }">{{ selectedText || 'None' }}</text>
      </view>

      <!-- Cascader embedded -->
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Cascader
          v-model="selectedValue"
          title="Select Area"
          :options="options"
          :closeable="false"
          @finish="onFinish"
        />
      </view>
    </view>
  </view>
</template>
