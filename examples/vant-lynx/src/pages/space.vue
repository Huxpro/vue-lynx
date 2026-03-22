<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Space from '../components/Space/index.vue';
import Button from '../components/Button/index.vue';

const align = ref<'start' | 'center' | 'end' | 'baseline'>('center');

function setAlign(value: 'start' | 'center' | 'end' | 'baseline') {
  align.value = value;
}
</script>

<template>
  <DemoPage title="Space">
    <!-- Basic Usage -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '16px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">基础用法</text>
      <Space>
        <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
      </Space>
    </view>

    <!-- Vertical -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">垂直排列</text>
      <Space direction="vertical" fill>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
      </Space>
    </view>

    <!-- Custom Size -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">自定义间距</text>
      <view :style="{ marginBottom: '16px' }">
        <Space :size="20">
          <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
          <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
          <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        </Space>
      </view>
    </view>

    <!-- Alignment -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">对齐方式</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px' }">
        <Button :type="align === 'start' ? 'primary' : 'default'" size="small" @click="setAlign('start')"><text :style="{ fontSize: '12px', color: align === 'start' ? '#fff' : '#323233' }">start</text></Button>
        <view :style="{ width: '8px' }" />
        <Button :type="align === 'center' ? 'primary' : 'default'" size="small" @click="setAlign('center')"><text :style="{ fontSize: '12px', color: align === 'center' ? '#fff' : '#323233' }">center</text></Button>
        <view :style="{ width: '8px' }" />
        <Button :type="align === 'end' ? 'primary' : 'default'" size="small" @click="setAlign('end')"><text :style="{ fontSize: '12px', color: align === 'end' ? '#fff' : '#323233' }">end</text></Button>
        <view :style="{ width: '8px' }" />
        <Button :type="align === 'baseline' ? 'primary' : 'default'" size="small" @click="setAlign('baseline')"><text :style="{ fontSize: '12px', color: align === 'baseline' ? '#fff' : '#323233' }">baseline</text></Button>
      </view>
      <view :style="{ padding: '16px', backgroundColor: '#f3f2f5', borderRadius: '4px' }">
        <Space :align="align">
          <Button type="primary"><text :style="{ fontSize: '14px', color: '#fff' }">{{ align }}</text></Button>
          <view :style="{ padding: '40px 20px', backgroundColor: '#fff' }">
            <text :style="{ fontSize: '14px', color: '#323233' }">Block</text>
          </view>
        </Space>
      </view>
    </view>

    <!-- Auto Wrap -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">自动换行</text>
      <Space wrap>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
        <Button type="primary" block><text :style="{ fontSize: '14px', color: '#fff' }">按钮</text></Button>
      </Space>
    </view>
  </DemoPage>
</template>
