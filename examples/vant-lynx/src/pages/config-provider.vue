<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ConfigProvider from '../components/ConfigProvider/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

const isDark = ref(false);
function toggleTheme() { isDark.value = !isDark.value; }

const customVars = {
  '--van-button-primary-background': '#ff6034',
  '--van-button-primary-border-color': '#ff6034',
};
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ConfigProvider</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Default Theme</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <ConfigProvider>
          <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
            <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Primary</text></Button>
            <Button type="success"><text :style="{ fontSize: 14, color: '#fff' }">Success</text></Button>
            <Button type="danger"><text :style="{ fontSize: 14, color: '#fff' }">Danger</text></Button>
          </view>
        </ConfigProvider>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dark Theme</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden', marginBottom: 16 }">
        <ConfigProvider theme="dark">
          <view :style="{ padding: 16, backgroundColor: '#1a1a1a' }">
            <text :style="{ fontSize: 14, color: '#f5f5f5', marginBottom: 12 }">Dark mode content</text>
            <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
              <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Primary</text></Button>
              <Button type="default"><text :style="{ fontSize: 14, color: '#323233' }">Default</text></Button>
            </view>
          </view>
        </ConfigProvider>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Theme Vars</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <ConfigProvider :theme-vars="customVars">
          <view :style="{ display: 'flex', flexDirection: 'column', gap: 8 }">
            <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">Custom primary color (#ff6034)</text>
            <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
              <Button type="primary" color="#ff6034"><text :style="{ fontSize: 14, color: '#fff' }">Custom</text></Button>
              <Button type="primary" color="#ff6034" plain><text :style="{ fontSize: 14, color: '#ff6034' }">Plain</text></Button>
            </view>
          </view>
        </ConfigProvider>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toggle Theme</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginBottom: 12 }">
          <Button type="primary" @click="toggleTheme">
            <text :style="{ fontSize: 14, color: '#fff' }">{{ isDark ? 'Switch to Light' : 'Switch to Dark' }}</text>
          </Button>
        </view>
        <ConfigProvider :theme="isDark ? 'dark' : 'light'">
          <view :style="{ padding: 12, backgroundColor: isDark ? '#1a1a1a' : '#f7f8fa', borderRadius: 8 }">
            <text :style="{ fontSize: 14, color: isDark ? '#f5f5f5' : '#323233' }">
              Current theme: {{ isDark ? 'dark' : 'light' }}
            </text>
          </view>
        </ConfigProvider>
      </view>

    </view>
  </view>
</template>
