<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ConfigProvider from '../components/ConfigProvider/index.vue';
import Button from '../components/Button/index.vue';

const themeVars = {
  buttonPrimaryBackground: '#07c160',
  buttonPrimaryBorderColor: '#07c160',
};
</script>

<template>
  <DemoPage title="ConfigProvider">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">

      <!-- Section 1: Dark Mode (matches Vant demo) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">深色模式</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px' }">
        <text :style="{ fontSize: '14px', color: '#323233' }">请点击右上角按钮，切换深浅模式。</text>
      </view>

      <!-- Section 2: Default Theme (matches Vant demo) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">默认主题</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px' }">
        <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
          <Button type="primary">
            <text :style="{ fontSize: '14px', color: '#fff' }">提交</text>
          </Button>
        </view>
      </view>

      <!-- Section 3: Custom Theme (matches Vant demo) -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">定制主题</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <ConfigProvider :theme-vars="themeVars">
          <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
            <Button type="primary">
              <text :style="{ fontSize: '14px', color: '#fff' }">提交</text>
            </Button>
          </view>
        </ConfigProvider>
      </view>

    </view>
  </DemoPage>
</template>
