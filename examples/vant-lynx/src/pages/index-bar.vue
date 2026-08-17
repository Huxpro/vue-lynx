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
</script>

<template>
  <DemoPage title="IndexBar 索引栏">
    <!-- Tab bar -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderBottomWidth: '0.5px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#ebedf0',
    }">
      <view
        :style="{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '44px',
          borderBottomWidth: activeTab === 0 ? '2px' : '0px',
          borderBottomStyle: 'solid',
          borderBottomColor: activeTab === 0 ? '#1989fa' : 'transparent',
        }"
        @tap="activeTab = 0"
      >
        <text :style="{
          fontSize: '14px',
          color: activeTab === 0 ? '#1989fa' : '#323233',
          fontWeight: activeTab === 0 ? 'bold' : 'normal',
        }">基础用法</text>
      </view>
      <view
        :style="{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '44px',
          borderBottomWidth: activeTab === 1 ? '2px' : '0px',
          borderBottomStyle: 'solid',
          borderBottomColor: activeTab === 1 ? '#1989fa' : 'transparent',
        }"
        @tap="activeTab = 1"
      >
        <text :style="{
          fontSize: '14px',
          color: activeTab === 1 ? '#1989fa' : '#323233',
          fontWeight: activeTab === 1 ? 'bold' : 'normal',
        }">自定义索引列表</text>
      </view>
    </view>

    <!-- 基础用法 -->
    <view v-if="activeTab === 0">
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
    <view v-if="activeTab === 1">
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
