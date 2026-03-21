<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Space from '../components/Space/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="Space">
    

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
  </DemoPage>
</template>
