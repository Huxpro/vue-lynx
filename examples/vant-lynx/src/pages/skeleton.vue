<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Skeleton from '../components/Skeleton/index.vue';
const show = ref(false);

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
const sectionStyle = {
  backgroundColor: '#fff',
  paddingTop: '8px',
  paddingBottom: '8px',
};
</script>

<template>
  <DemoPage title="Skeleton">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="sectionStyle">
        <Skeleton :row="3" title />
      </view>

      <!-- Show Avatar -->
      <text :style="sectionTitleStyle">显示头像</text>
      <view :style="sectionStyle">
        <Skeleton :row="3" title avatar />
      </view>

      <!-- Show Children -->
      <text :style="sectionTitleStyle">显示子组件</text>
      <view :style="sectionStyle">
        <view :style="{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px' }">
          <view
            :style="{
              width: '50px',
              height: '24px',
              backgroundColor: show ? '#1989fa' : '#c8c9cc',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: show ? 'flex-end' : 'flex-start',
              paddingLeft: '2px',
              paddingRight: '2px',
            }"
            @tap="show = !show"
          >
            <view :style="{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: '#fff' }" />
          </view>
        </view>
        <Skeleton :row="3" title avatar :loading="!show">
          <view :style="{ display: 'flex', flexDirection: 'row', paddingLeft: '16px', paddingRight: '16px' }">
            <view :style="{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#1989fa', marginRight: '16px', flexShrink: 0 }" />
            <view :style="{ display: 'flex', flexDirection: 'column' }">
              <text :style="{ fontSize: '18px', fontWeight: 'bold', color: '#323233' }">关于 Vant</text>
              <text :style="{ fontSize: '14px', color: '#969799', marginTop: '13px', lineHeight: '20px' }">Vant 是一套轻量、可定制的移动端 Vue 组件库，提供了丰富的基础组件和业务组件，帮助开发者快速搭建移动应用。</text>
            </view>
          </view>
        </Skeleton>
      </view>

      <!-- Custom Content -->
      <text :style="sectionTitleStyle">自定义展示内容</text>
      <view :style="sectionStyle">
        <Skeleton>
          <template #template>
            <view :style="{ display: 'flex', flexDirection: 'row', width: '100%' }">
              <view :style="{ width: '96px', height: '96px', backgroundColor: '#f2f3f5', borderRadius: '24px', flexShrink: 0 }" />
              <view :style="{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column' }">
                <view :style="{ width: '60%', height: '16px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
                <view :style="{ width: '100%', height: '16px', backgroundColor: '#f2f3f5', borderRadius: '4px', marginTop: '12px' }" />
                <view :style="{ width: '100%', height: '16px', backgroundColor: '#f2f3f5', borderRadius: '4px', marginTop: '12px' }" />
                <view :style="{ width: '100%', height: '16px', backgroundColor: '#f2f3f5', borderRadius: '4px', marginTop: '12px' }" />
              </view>
            </view>
          </template>
        </Skeleton>
      </view>
    </view>
  </DemoPage>
</template>
