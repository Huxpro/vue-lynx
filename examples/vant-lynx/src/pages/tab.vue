<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';

const active1 = ref(0);
const active2 = ref('a');
const active3 = ref(0);
const active4 = ref(0);
const active5 = ref(0);
const active6 = ref(0);
const active7 = ref(0);
const active8 = ref(0);
const active9 = ref(0);
const active10 = ref(0);
const active11 = ref(0);
const active12 = ref(0);
const active13 = ref(0);

const clickedTab = ref('');

const onClickTab = ({ title }: { title: string }) => {
  clickedTab.value = title;
};

const beforeChange = (name: number) => {
  if (name === 1) {
    return false;
  }
  if (name === 3) {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 1000);
    });
  }
  return true;
};
</script>

<template>
  <DemoPage title="Tab 标签页">

    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 1. Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active1">
          <Tab v-for="index in 4" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 2. Match by Name -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">通过名称匹配</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active2">
          <Tab name="a" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab name="b" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
          <Tab name="c" title="标签 3">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 3. Swipe Tabs (Scrollable) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">标签栏滚动</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active3">
          <Tab v-for="index in 8" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 4. Disabled Tab -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">禁用标签</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active4">
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2" disabled>
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="标签 3">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 5. Card Style -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">样式风格</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active5" type="card">
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="标签 3">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 6. Click Event -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">点击事件</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active6" @click-tab="onClickTab">
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
        </Tabs>
        <view v-if="clickedTab" :style="{ padding: '8px 16px' }">
          <text :style="{ fontSize: '12px', color: '#969799' }">点击了: {{ clickedTab }}</text>
        </view>
      </view>

      <!-- 7. Sticky (Lynx limitation: not functional) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">粘性布局</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active7" sticky>
          <Tab v-for="index in 4" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
              <text :style="{ fontSize: '12px', color: '#969799' }">(sticky 在 Lynx 中暂不生效)</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 8. Shrink -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">收缩布局</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active8" shrink>
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="标签 3">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 9. Custom Tab (title slot — Lynx limitation: not functional) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义标签</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active9">
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 10. Switch Animation (Lynx limitation: not functional) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">切换动画</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active10" animated>
          <Tab v-for="index in 4" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
              <text :style="{ fontSize: '12px', color: '#969799' }">(animated 在 Lynx 中暂不生效)</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 11. Swipeable (Lynx limitation: not functional) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">滑动切换</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active11" swipeable>
          <Tab v-for="index in 4" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
              <text :style="{ fontSize: '12px', color: '#969799' }">(swipeable 在 Lynx 中暂不生效)</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 12. Scrollspy (Lynx limitation: not functional) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">滚动导航</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active12" scrollspy>
          <Tab v-for="index in 4" :key="index" :name="index - 1" :title="'标签 ' + index">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 {{ index }}</text>
              <text :style="{ fontSize: '12px', color: '#969799' }">(scrollspy 在 Lynx 中暂不生效)</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- 13. Before Change (async switching) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">异步切换</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Tabs v-model:active="active13" :before-change="beforeChange">
          <Tab :name="0" title="标签 1">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="标签 2">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 2 (被拦截)</text>
            </view>
          </Tab>
          <Tab :name="2" title="标签 3">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 3</text>
            </view>
          </Tab>
          <Tab :name="3" title="标签 4">
            <view :style="{ padding: '16px' }">
              <text :style="{ fontSize: '14px', color: '#323233' }">内容 4 (异步拦截)</text>
            </view>
          </Tab>
        </Tabs>
      </view>
    </view>
  </DemoPage>
</template>
