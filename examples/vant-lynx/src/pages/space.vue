<script setup lang="ts">
import { useRouter } from 'vue-router';
import Space from '../components/Space/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Space</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Space>
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 1</text></Button>
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 2</text></Button>
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 3</text></Button>
        </Space>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Space direction="vertical" :size="16">
          <Button type="primary" block><text :style="{ fontSize: 14, color: '#fff' }">Button 1</text></Button>
          <Button type="primary" block><text :style="{ fontSize: 14, color: '#fff' }">Button 2</text></Button>
          <Button type="primary" block><text :style="{ fontSize: 14, color: '#fff' }">Button 3</text></Button>
        </Space>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Space :size="20">
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 1</text></Button>
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 2</text></Button>
          <Button type="primary"><text :style="{ fontSize: 14, color: '#fff' }">Button 3</text></Button>
        </Space>
      </view>
    </view>
  </view>
</template>
