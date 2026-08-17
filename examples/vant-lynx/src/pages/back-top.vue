<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import BackTop from '../components/BackTop/index.vue';
import Cell from '../components/Cell/index.vue';

const backTopRef = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef2 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef3 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef4 = ref<InstanceType<typeof BackTop> | null>(null);
const backTopRef5 = ref<InstanceType<typeof BackTop> | null>(null);

const activeTab = ref(0);
const items = Array.from({ length: 50 }, (_, i) => i);

function setTab(index: number) {
  activeTab.value = index;
}

function onScroll(event: any) {
  if (activeTab.value === 0) backTopRef.value?.handleScroll(event);
  else if (activeTab.value === 1) backTopRef2.value?.handleScroll(event);
  else if (activeTab.value === 2) backTopRef3.value?.handleScroll(event);
  else if (activeTab.value === 3) backTopRef4.value?.handleScroll(event);
  else if (activeTab.value === 4) backTopRef5.value?.handleScroll(event);
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16px', backgroundColor: '#fff' }">
      <text :style="{ fontSize: '18px', fontWeight: 'bold', color: '#323233' }">BackTop 回到顶部</text>
    </view>

    <!-- Tab Selector -->
    <scroll-view scroll-orientation="horizontal" :style="{ flexDirection: 'row', padding: '8px 16px', backgroundColor: '#fff' }">
      <view
        v-for="(label, idx) in ['基础用法', '自定义位置', '自定义内容', '设置滚动目标', '瞬间滚动']"
        :key="idx"
        :style="{
          paddingTop: '6px',
          paddingBottom: '6px',
          paddingLeft: '12px',
          paddingRight: '12px',
          marginRight: '8px',
          borderRadius: '4px',
          backgroundColor: activeTab === idx ? '#1989fa' : '#f7f8fa',
        }"
        @tap="setTab(idx)"
      >
        <text :style="{ fontSize: '12px', color: activeTab === idx ? '#fff' : '#323233' }">{{ label }}</text>
      </view>
    </scroll-view>

    <!-- Scrollable Content -->
    <scroll-view scroll-orientation="vertical" :style="{ flex: 1 }" @scroll="onScroll">
      <Cell v-for="item in items" :key="item" :title="String(item)" />
    </scroll-view>

    <!-- BackTop buttons for each tab -->
    <BackTop v-if="activeTab === 0" ref="backTopRef" />
    <BackTop v-if="activeTab === 1" ref="backTopRef2" right="15vw" bottom="10vh" />
    <BackTop v-if="activeTab === 2" ref="backTopRef3">
      <text :style="{ color: '#fff', fontSize: '14px' }">返回顶部</text>
    </BackTop>
    <BackTop v-if="activeTab === 3" ref="backTopRef4" bottom="30vh" />
    <BackTop v-if="activeTab === 4" ref="backTopRef5" :immediate="true" />
  </view>
</template>
