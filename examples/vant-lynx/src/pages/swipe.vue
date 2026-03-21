<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Swipe from '../components/Swipe/index.vue';

const colors = ['#39a9ed', '#66c6f2', '#3cb371', '#ff6347'];
const changeLog = ref('');

function onSwipeChange(index: number) {
  changeLog.value = `Current: ${index + 1}`;
}
</script>

<template>
  <DemoPage title="Swipe">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="150">
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 150, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>

      <!-- Autoplay -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Autoplay</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="150" :autoplay="3000">
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 150, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>

      <!-- Change Event -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Change Event</text>
      <view :style="{ marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="150" @change="onSwipeChange">
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 150, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>
      <view v-if="changeLog" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ changeLog }}</text>
      </view>

      <!-- Custom Indicator -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Indicator</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="150" indicator-color="#ee0a24">
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 150, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>

      <!-- Vertical -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="150" vertical>
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 150, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>

      <!-- Custom Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Swipe :height="200" :width="250" :loop="false">
          <view v-for="(color, i) in colors" :key="i" :style="{ height: 200, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 20, color: '#fff', fontWeight: 'bold' }">{{ i + 1 }}</text>
          </view>
        </Swipe>
      </view>
    </view>
  </DemoPage>
</template>
