<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Pagination from '../components/Pagination/index.vue';

const currentPage1 = ref(1);
const currentPage2 = ref(1);
const currentPage3 = ref(1);
const currentPage4 = ref(1);

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
const sectionStyle = {
  backgroundColor: '#fff',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
};
</script>

<template>
  <DemoPage title="Pagination">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="sectionStyle">
        <Pagination
          v-model="currentPage1"
          :total-items="24"
          :items-per-page="5"
          prev-text="上一页"
          next-text="下一页"
        />
      </view>

      <!-- Simple Mode -->
      <text :style="sectionTitleStyle">简单模式</text>
      <view :style="sectionStyle">
        <Pagination
          v-model="currentPage2"
          :page-count="12"
          mode="simple"
          prev-text="上一页"
          next-text="下一页"
        />
      </view>

      <!-- Show Ellipses -->
      <text :style="sectionTitleStyle">显示省略号</text>
      <view :style="sectionStyle">
        <Pagination
          v-model="currentPage3"
          force-ellipses
          :total-items="125"
          :show-page-size="3"
          prev-text="上一页"
          next-text="下一页"
        />
      </view>

      <!-- Custom Button -->
      <text :style="sectionTitleStyle">自定义按钮</text>
      <view :style="sectionStyle">
        <Pagination
          v-model="currentPage4"
          :total-items="125"
          :show-page-size="5"
        >
          <template #prev-text>
            <text :style="{ fontSize: '14px', color: '#1989fa' }">&#x2190;</text>
          </template>
          <template #next-text>
            <text :style="{ fontSize: '14px', color: '#1989fa' }">&#x2192;</text>
          </template>
          <template #page="{ text }">
            <text>{{ text }}</text>
          </template>
        </Pagination>
      </view>
    </view>
  </DemoPage>
</template>
