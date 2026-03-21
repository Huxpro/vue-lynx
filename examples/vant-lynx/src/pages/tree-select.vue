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

// Disabled items
const disabledItems = [
  {
    text: 'Group A',
    id: 'a',
    children: [
      { text: 'Option 1', id: 'a1' },
      { text: 'Option 2 (disabled)', id: 'a2', disabled: true },
      { text: 'Option 3', id: 'a3' },
    ],
  },
  {
    text: 'Group B (disabled)',
    id: 'b',
    disabled: true,
    children: [
      { text: 'Option 4', id: 'b1' },
    ],
  },
];
const disabledActiveId = ref('a1');
const disabledMainIndex = ref(0);

// Show badge
const badgeItems = [
  {
    text: 'Zhejiang',
    id: 'zj',
    badge: '5',
    children: [
      { text: 'Hangzhou', id: 'hz2' },
      { text: 'Wenzhou', id: 'wz2' },
    ],
  },
  {
    text: 'Jiangsu',
    id: 'js',
    dot: true,
    children: [
      { text: 'Nanjing', id: 'nj2' },
      { text: 'Wuxi', id: 'wx2' },
    ],
  },
];
const badgeActiveId = ref('hz2');
const badgeMainIndex = ref(0);

// Custom content
const customItems = [
  { text: 'Group 1', id: 'g1' },
  { text: 'Group 2', id: 'g2' },
];
const customMainIndex = ref(0);
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
      <view :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ multiActiveIds.join(', ') }}</text>
      </view>

      <!-- Show Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Badge</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <TreeSelect
          :items="badgeItems"
          v-model:active-id="badgeActiveId"
          v-model:main-active-index="badgeMainIndex"
        />
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Content</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <TreeSelect
          :items="customItems"
          v-model:main-active-index="customMainIndex"
          :height="180"
        >
          <template #content>
            <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
              <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">Custom content for Group {{ customMainIndex + 1 }}</text>
              <view :style="{ padding: 8, backgroundColor: '#f7f8fa', borderRadius: 4 }">
                <text :style="{ fontSize: 12, color: '#969799' }">You can put any content here using the content slot.</text>
              </view>
            </view>
          </template>
        </TreeSelect>
      </view>

      <!-- Disabled Items -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Items</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <TreeSelect
          :items="disabledItems"
          v-model:active-id="disabledActiveId"
          v-model:main-active-index="disabledMainIndex"
        />
      </view>
      <view :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ disabledActiveId }}</text>
      </view>
    </view>
  </DemoPage>
</template>
