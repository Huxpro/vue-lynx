<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Empty from '../components/Empty/index.vue';
import Button from '../components/Button/index.vue';

const activeTab = ref('error');

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
const sectionStyle = {
  backgroundColor: '#fff',
};
</script>

<template>
  <DemoPage title="Empty">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="sectionStyle">
        <Empty description="描述文字" />
      </view>

      <!-- Image Type -->
      <text :style="sectionTitleStyle">图片类型</text>
      <view :style="sectionStyle">
        <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingTop: '8px', paddingBottom: '8px' }">
          <view
            v-for="tab in ['error', 'network', 'search']"
            :key="tab"
            :style="{
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderBottomWidth: activeTab === tab ? '2px' : '0px',
              borderBottomStyle: 'solid',
              borderBottomColor: '#1989fa',
            }"
            @tap="activeTab = tab"
          >
            <text :style="{ fontSize: '14px', color: activeTab === tab ? '#1989fa' : '#323233' }">{{ tab === 'error' ? '通用错误' : tab === 'network' ? '网络错误' : '搜索提示' }}</text>
          </view>
        </view>
        <Empty :image="activeTab" description="描述文字" />
      </view>

      <!-- Custom Size -->
      <text :style="sectionTitleStyle">自定义大小</text>
      <view :style="sectionStyle">
        <Empty image-size="100" description="描述文字" />
      </view>

      <!-- Custom Image -->
      <text :style="sectionTitleStyle">自定义图片</text>
      <view :style="sectionStyle">
        <Empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          :image-size="80"
          description="描述文字"
        />
      </view>

      <!-- Bottom Content -->
      <text :style="sectionTitleStyle">底部内容</text>
      <view :style="sectionStyle">
        <Empty description="描述文字">
          <Button round type="primary" :style="{ width: '160px' }">按钮</Button>
        </Empty>
      </view>
    </view>
  </DemoPage>
</template>
