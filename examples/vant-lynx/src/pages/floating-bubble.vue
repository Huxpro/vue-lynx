<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import FloatingBubble from '../components/FloatingBubble/index.vue';
import type { FloatingBubbleOffset } from '../components/FloatingBubble/types';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';

const activeName = ref(0);
const offset = ref<FloatingBubbleOffset>({ x: 200, y: 400 });

const onOffsetChange = (o: FloatingBubbleOffset) => {
  console.log(`offset changed: x=${o.x.toFixed(0)}, y=${o.y.toFixed(0)}`);
};

const onClick = () => {
  console.log('FloatingBubble clicked');
};
</script>

<template>
  <DemoPage title="FloatingBubble 浮动气泡">
    <Tabs v-model:active="activeName">
      <Tab title="基础用法">
        <view :style="{ padding: '100px 20px', alignItems: 'center' }">
          <text :style="{ fontSize: '14px', color: '#969799', textAlign: 'center' }">
            在 x 轴默认位置，允许 y 轴方向拖拽
          </text>
        </view>
        <FloatingBubble
          v-if="activeName === 0"
          icon="chat"
          @click="onClick"
        />
      </Tab>
      <Tab title="自由拖拽和磁吸">
        <view :style="{ padding: '100px 20px', alignItems: 'center' }">
          <text :style="{ fontSize: '14px', color: '#969799', textAlign: 'center' }">
            允许 x 和 y 轴方向拖拽，吸附到 x 轴方向最近一边
          </text>
        </view>
        <FloatingBubble
          v-if="activeName === 1"
          icon="chat"
          axis="xy"
          magnetic="x"
          @offset-change="onOffsetChange"
        />
      </Tab>
      <Tab title="双向绑定">
        <view :style="{ padding: '100px 20px', alignItems: 'center' }">
          <text :style="{ fontSize: '14px', color: '#969799', textAlign: 'center' }">
            使用 offset 控制位置，x：{{ offset.x.toFixed(0) }} y：{{ offset.y.toFixed(0) }}
          </text>
        </view>
        <FloatingBubble
          v-if="activeName === 2"
          icon="chat"
          v-model:offset="offset"
          axis="xy"
        />
      </Tab>
    </Tabs>
  </DemoPage>
</template>
