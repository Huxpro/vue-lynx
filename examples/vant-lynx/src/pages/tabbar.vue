<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabbar from '../components/Tabbar/index.vue';
import TabbarItem from '../components/TabbarItem/index.vue';

const active1 = ref(0);
const activeName = ref('home');
const active2 = ref(0);
const active3 = ref(0);
const active4 = ref(0);
const active5 = ref(0);

const onChange = (index: number | string) => {
  // Show which tab was switched to
};
</script>

<template>
  <DemoPage title="Tabbar">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">

      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="active1" :fixed="false">
          <TabbarItem icon="home-o">标签</TabbarItem>
          <TabbarItem icon="search">标签</TabbarItem>
          <TabbarItem icon="friends-o">标签</TabbarItem>
          <TabbarItem icon="setting-o">标签</TabbarItem>
        </Tabbar>
      </view>

      <!-- 通过名称匹配 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '8px' }">通过名称匹配</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="activeName" :fixed="false">
          <TabbarItem name="home" icon="home-o">标签</TabbarItem>
          <TabbarItem name="search" icon="search">标签</TabbarItem>
          <TabbarItem name="friends" icon="friends-o">标签</TabbarItem>
          <TabbarItem name="setting" icon="setting-o">标签</TabbarItem>
        </Tabbar>
      </view>

      <!-- 徽标提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '8px' }">徽标提示</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="active2" :fixed="false">
          <TabbarItem icon="home-o">标签</TabbarItem>
          <TabbarItem icon="search" dot>标签</TabbarItem>
          <TabbarItem icon="friends-o" badge="5">标签</TabbarItem>
          <TabbarItem icon="setting-o" badge="20">标签</TabbarItem>
        </Tabbar>
      </view>

      <!-- 自定义图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '8px' }">自定义图标</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="active3" :fixed="false">
          <TabbarItem badge="3">
            <text>自定义</text>
            <template #icon="slotProps">
              <text :style="{ fontSize: '22px', color: slotProps.active ? '#1989fa' : '#323233' }">★</text>
            </template>
          </TabbarItem>
          <TabbarItem icon="search">标签</TabbarItem>
          <TabbarItem icon="setting-o">标签</TabbarItem>
        </Tabbar>
      </view>

      <!-- 自定义颜色 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '8px' }">自定义颜色</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="active4" :fixed="false" active-color="#ee0a24">
          <TabbarItem icon="home-o">标签</TabbarItem>
          <TabbarItem icon="search">标签</TabbarItem>
          <TabbarItem icon="friends-o">标签</TabbarItem>
          <TabbarItem icon="setting-o">标签</TabbarItem>
        </Tabbar>
      </view>

      <!-- 监听切换事件 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '8px' }">监听切换事件</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabbar v-model="active5" :fixed="false" @change="onChange">
          <TabbarItem icon="home-o">标签 1</TabbarItem>
          <TabbarItem icon="search">标签 2</TabbarItem>
          <TabbarItem icon="friends-o">标签 3</TabbarItem>
          <TabbarItem icon="setting-o">标签 4</TabbarItem>
        </Tabbar>
      </view>

    </view>
  </DemoPage>
</template>
