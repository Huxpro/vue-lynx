<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import FloatingPanel from '../components/FloatingPanel/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';

const activeName = ref(0);

// Custom anchors demo
const SCREEN_HEIGHT = 800;
const anchors = [
  100,
  Math.round(0.4 * SCREEN_HEIGHT),
  Math.round(0.7 * SCREEN_HEIGHT),
];
const panelHeight = ref(anchors[0]);
</script>

<template>
  <DemoPage title="FloatingPanel 浮动面板">
    <Tabs v-model:active="activeName">
      <Tab title="基础用法">
        <FloatingPanel v-if="activeName === 0">
          <CellGroup>
            <Cell
              v-for="i in 26"
              :key="i"
              :title="String.fromCharCode(i + 64)"
              size="large"
            />
          </CellGroup>
        </FloatingPanel>
      </Tab>

      <Tab title="自定义锚点">
        <FloatingPanel
          v-if="activeName === 1"
          v-model:height="panelHeight"
          :anchors="anchors"
        >
          <view :style="{ padding: '16px', alignItems: 'center' }">
            <text :style="{ fontSize: '14px', color: '#323233', textAlign: 'center' }">
              面板显示高度 {{ panelHeight.toFixed(0) }} px
            </text>
          </view>
        </FloatingPanel>
      </Tab>

      <Tab title="仅头部拖拽">
        <FloatingPanel
          v-if="activeName === 2"
          :content-draggable="false"
        >
          <view :style="{ padding: '16px', alignItems: 'center' }">
            <text :style="{ fontSize: '14px', color: '#323233', textAlign: 'center' }">
              内容不可拖拽
            </text>
          </view>
        </FloatingPanel>
      </Tab>

      <Tab title="禁用吸附">
        <FloatingPanel
          v-if="activeName === 3"
          :magnetic="false"
        >
          <view :style="{ padding: '16px', alignItems: 'center' }">
            <text :style="{ fontSize: '14px', color: '#969799', textAlign: 'center' }">
              已禁用磁力吸附，可在边界内任意停留
            </text>
          </view>
        </FloatingPanel>
      </Tab>

      <Tab title="禁用拖拽">
        <FloatingPanel
          v-if="activeName === 4"
          :draggable="false"
        >
          <view :style="{ padding: '16px', alignItems: 'center' }">
            <text :style="{ fontSize: '14px', color: '#969799', textAlign: 'center' }">
              该面板不可拖拽
            </text>
          </view>
        </FloatingPanel>
      </Tab>
    </Tabs>
  </DemoPage>
</template>
