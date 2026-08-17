<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Swipe from '../components/Swipe/index.vue';
import SwipeItem from '../components/SwipeItem/index.vue';

const swipeRef = ref<InstanceType<typeof Swipe> | null>(null);
const current = ref(0);

const colors = ['#39a9ed', '#66c6f2', '#3cb371', '#ff6347'];

function onChange(index: number) {
  current.value = index;
}
</script>

<template>
  <DemoPage title="Swipe">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe :autoplay="3000" indicator-color="#fff">
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '150px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
        </Swipe>
      </view>

      <!-- Lazy Render -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">懒加载</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe :autoplay="3000" lazy-render>
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '150px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
        </Swipe>
      </view>

      <!-- Listen to change Event -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">监听 change 事件</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe @change="onChange">
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '150px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
        </Swipe>
        <text :style="{ fontSize: '14px', color: '#646566', textAlign: 'center', padding: '8px' }">当前: {{ current }}</text>
      </view>

      <!-- Vertical Scrolling -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">纵向滚动</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe :autoplay="3000" vertical :height="200">
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '200px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
        </Swipe>
      </view>

      <!-- Custom Size -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义滑块大小</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe :width="300" :loop="false">
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '150px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
        </Swipe>
      </view>

      <!-- Custom Indicator -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义指示器</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <Swipe ref="swipeRef" @change="onChange">
          <SwipeItem v-for="(color, i) in colors" :key="i">
            <view :style="{ height: '150px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
            </view>
          </SwipeItem>
          <template #indicator="{ active, total }">
            <view :style="{ position: 'absolute', right: '8px', bottom: '8px', paddingLeft: '5px', paddingRight: '5px', paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '10px' }">
              <text :style="{ fontSize: '12px', color: '#fff' }">{{ active + 1 }}/{{ total }}</text>
            </view>
          </template>
        </Swipe>
      </view>
    </view>
  </DemoPage>
</template>
