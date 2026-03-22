<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sidebar from '../components/Sidebar/index.vue';
import SidebarItem from '../components/SidebarItem/index.vue';

const active1 = ref(0);
const active2 = ref(0);
const active3 = ref(0);
const active4 = ref(0);

const changeResult = ref('');
function onChange(index: number) {
  changeResult.value = `标签名 ${index + 1}`;
}
</script>

<template>
  <DemoPage title="Sidebar 侧边导航">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', height: '200px' }">
        <Sidebar v-model="active1">
          <SidebarItem title="标签名" />
          <SidebarItem title="标签名" />
          <SidebarItem title="标签名" />
        </Sidebar>
        <view :style="{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ active1 + 1 }}</text>
        </view>
      </view>

      <!-- 徽标提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">徽标提示</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', height: '200px' }">
        <Sidebar v-model="active2">
          <SidebarItem title="标签名" dot />
          <SidebarItem title="标签名" badge="5" />
          <SidebarItem title="标签名" />
        </Sidebar>
        <view :style="{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ active2 + 1 }}</text>
        </view>
      </view>

      <!-- 禁用选项 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用选项</text>
      <view :style="{ marginBottom: '16px', display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', height: '200px' }">
        <Sidebar v-model="active3">
          <SidebarItem title="标签名" />
          <SidebarItem title="标签名" disabled />
          <SidebarItem title="标签名" />
        </Sidebar>
        <view :style="{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ active3 + 1 }}</text>
        </view>
      </view>

      <!-- 监听切换事件 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">监听切换事件</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', height: '200px' }">
        <Sidebar v-model="active4" @change="onChange">
          <SidebarItem title="标签名 1" />
          <SidebarItem title="标签名 2" />
          <SidebarItem title="标签名 3" />
        </Sidebar>
        <view :style="{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: '14px', color: '#323233' }">{{ changeResult || '点击侧边栏切换' }}</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
