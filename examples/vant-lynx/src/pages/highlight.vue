<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Highlight from '../components/Highlight/index.vue';

const text =
  'Take your time and be patient. Life itself will eventually answer all those questions it once raised for you.';
</script>

<template>
  <DemoPage title="Highlight 高亮文本">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <Highlight
          :source-string="text"
          keywords="questions"
        />
      </view>

      <!-- Multiple Keywords -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">多字符匹配</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }">
        <Highlight
          :source-string="text"
          :keywords="['time', 'life', 'answer']"
        />
      </view>

      <!-- Highlight Class Name -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">设置高亮标签类名</text>
      <view :style="{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }">
        <Highlight
          :source-string="text"
          keywords="life"
          highlight-class="custom-highlight"
        />
      </view>
    </view>
  </DemoPage>
</template>
