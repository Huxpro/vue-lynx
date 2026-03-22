<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CountDown from '../components/CountDown/index.vue';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';

const time = ref(30 * 60 * 60 * 1000);
const countDown = ref<InstanceType<typeof CountDown>>();

const start = () => {
  countDown.value?.start();
};
const pause = () => {
  countDown.value?.pause();
};
const resetCountDown = () => {
  countDown.value?.reset();
};
</script>

<template>
  <DemoPage title="CountDown 倒计时">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">基础用法</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <CountDown :time="time" />
      </view>

      <!-- 自定义格式 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">自定义格式</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <CountDown :time="time" format="DD 天 HH 时 mm 分 ss 秒" />
      </view>

      <!-- 毫秒级渲染 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">毫秒级渲染</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <CountDown millisecond :time="time" format="HH:mm:ss:SS" />
      </view>

      <!-- 自定义样式 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">自定义样式</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <CountDown :time="time">
          <template #default="{ current }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
              <text :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', color: '#fff', fontSize: '12px', textAlign: 'center', backgroundColor: '#1989fa', borderRadius: '4px' }">{{ String(current.hours).padStart(2, '0') }}</text>
              <text :style="{ marginLeft: '4px', marginRight: '4px', color: '#1989fa' }">:</text>
              <text :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', color: '#fff', fontSize: '12px', textAlign: 'center', backgroundColor: '#1989fa', borderRadius: '4px' }">{{ String(current.minutes).padStart(2, '0') }}</text>
              <text :style="{ marginLeft: '4px', marginRight: '4px', color: '#1989fa' }">:</text>
              <text :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', color: '#fff', fontSize: '12px', textAlign: 'center', backgroundColor: '#1989fa', borderRadius: '4px' }">{{ String(current.seconds).padStart(2, '0') }}</text>
            </view>
          </template>
        </CountDown>
      </view>

      <!-- 手动控制 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">手动控制</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <CountDown
          ref="countDown"
          millisecond
          :time="3000"
          :auto-start="false"
          format="ss:SSS"
        />
      </view>
      <Grid clickable :column-num="3">
        <GridItem text="开始" @click="start" />
        <GridItem text="暂停" @click="pause" />
        <GridItem text="重置" @click="resetCountDown" />
      </Grid>
    </view>
  </DemoPage>
</template>
