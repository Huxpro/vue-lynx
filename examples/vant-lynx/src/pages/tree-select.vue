<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import TreeSelect from '../components/TreeSelect/index.vue';

const items = [
  {
    text: '浙江',
    children: [
      { text: '杭州', id: 1 },
      { text: '温州', id: 2 },
      { text: '宁波', id: 3, disabled: true },
      { text: '义乌', id: 4 },
    ],
  },
  {
    text: '江苏',
    children: [
      { text: '南京', id: 5 },
      { text: '无锡', id: 6 },
      { text: '徐州', id: 7 },
    ],
  },
  {
    text: '福建',
    children: [
      { text: '泉州', id: 8 },
      { text: '厦门', id: 9 },
    ],
  },
];

const simpleItems = [{ text: '分组 1' }, { text: '分组 2' }];

const badgeItems = computed(() => {
  const data = JSON.parse(JSON.stringify(items)).slice(0, 2);
  data[0].dot = true;
  data[1].badge = 5;
  return data;
});

// Radio mode
const activeId = ref(1);
const activeIndex = ref(0);

// Multiple mode
const activeIds = ref([1, 2]);
const activeIndex2 = ref(0);

// Custom content
const activeIndex3 = ref(0);

// Badge
const activeId2 = ref(1);
const activeIndex4 = ref(0);

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
</script>

<template>
  <DemoPage title="TreeSelect">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Radio Mode -->
      <text :style="sectionTitleStyle">单选模式</text>
      <TreeSelect
        v-model:active-id="activeId"
        v-model:main-active-index="activeIndex"
        :items="items"
      />

      <!-- Multiple Mode -->
      <text :style="sectionTitleStyle">多选模式</text>
      <TreeSelect
        v-model:active-id="activeIds"
        v-model:main-active-index="activeIndex2"
        :items="items"
      />

      <!-- Custom Content -->
      <text :style="sectionTitleStyle">自定义内容</text>
      <TreeSelect
        v-model:main-active-index="activeIndex3"
        height="55vw"
        :items="simpleItems"
      >
        <template #content>
          <view :style="{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text v-if="activeIndex3 === 0" :style="{ fontSize: '14px', color: '#323233' }">分组 1 的内容</text>
            <text v-if="activeIndex3 === 1" :style="{ fontSize: '14px', color: '#323233' }">分组 2 的内容</text>
          </view>
        </template>
      </TreeSelect>

      <!-- Show Badge -->
      <text :style="sectionTitleStyle">徽标提示</text>
      <TreeSelect
        v-model:active-id="activeId2"
        v-model:main-active-index="activeIndex4"
        height="55vw"
        :items="badgeItems"
      />
    </view>
  </DemoPage>
</template>
