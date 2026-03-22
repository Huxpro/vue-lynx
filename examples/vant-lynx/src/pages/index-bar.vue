<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import IndexBar from '../components/IndexBar/index.vue';
import IndexAnchor from '../components/IndexAnchor/index.vue';
import Cell from '../components/Cell/index.vue';

const activeTab = ref(0);

const indexList: string[] = [];
const charCodeOfA = 'A'.charCodeAt(0);
for (let i = 0; i < 26; i++) {
  indexList.push(String.fromCharCode(charCodeOfA + i));
}

const customIndexList = [1, 2, 3, 4, 5, 6, 8, 9, 10];

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  marginTop: '16px',
  marginBottom: '12px',
  paddingLeft: '16px',
};

const tabBarStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  backgroundColor: '#fff',
  borderBottomWidth: '0.5px',
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

function getTabStyle(isActive: boolean) {
  return {
    flex: 1,
    display: 'flex',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '44px',
    borderBottomWidth: isActive ? '2px' : '0px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: isActive ? '#1989fa' : 'transparent',
  };
}

function getTabTextStyle(isActive: boolean) {
  return {
    fontSize: '14px',
    color: isActive ? '#1989fa' : '#323233',
    fontWeight: isActive ? 'bold' : 'normal',
  };
}
</script>

<template>
  <DemoPage title="IndexBar 索引栏">
    <!-- Tab bar -->
    <view :style="tabBarStyle">
      <view :style="getTabStyle(activeTab === 0)" @tap="activeTab = 0">
        <text :style="getTabTextStyle(activeTab === 0)">基础用法</text>
      </view>
      <view :style="getTabStyle(activeTab === 1)" @tap="activeTab = 1">
        <text :style="getTabTextStyle(activeTab === 1)">自定义索引列表</text>
      </view>
    </view>

    <!-- 基础用法 -->
    <view v-if="activeTab === 0" :style="{ display: 'flex', flexDirection: 'column' }">
      <IndexBar>
        <template v-for="index in indexList" :key="index">
          <IndexAnchor :index="index" />
          <Cell title="文本" />
          <Cell title="文本" />
          <Cell title="文本" />
        </template>
      </IndexBar>
    </view>

    <!-- 自定义索引列表 -->
    <view v-if="activeTab === 1" :style="{ display: 'flex', flexDirection: 'column' }">
      <IndexBar :index-list="customIndexList">
        <template v-for="index in customIndexList" :key="index">
          <IndexAnchor :index="index">
            <text :style="{ fontSize: '14px', fontWeight: 'bold', lineHeight: '32px', color: '#323233' }">标题{{ index }}</text>
          </IndexAnchor>
          <Cell title="文本" />
          <Cell title="文本" />
          <Cell title="文本" />
        </template>
      </IndexBar>
    </view>
  </DemoPage>
</template>
