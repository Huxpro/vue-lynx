<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CountDown from '../components/CountDown/index.vue';
const time1 = ref(30 * 1000);
const time2 = ref(30 * 60 * 60 * 1000);
const manualTime = ref(60 * 1000);
const countDownRef = ref<InstanceType<typeof CountDown> | null>(null);

function onStart() { countDownRef.value?.start(); }
function onPause() { countDownRef.value?.pause(); }
function onReset() { countDownRef.value?.reset(); }
</script>

<template>
  <DemoPage title="CountDown">


    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage (30s)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time1" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Format</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time2" format="DD Day, HH:mm:ss" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Millisecond</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time1" format="HH:mm:ss:SSS" millisecond />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time1" format="HH:mm:ss">
          <template #default="{ formatted }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
              <view :style="{ backgroundColor: '#ee0a24', borderRadius: 4, paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 }">
                <text :style="{ fontSize: 14, color: '#fff', fontWeight: 'bold' }">{{ formatted.slice(0, 2) }}</text>
              </view>
              <text :style="{ fontSize: 14, color: '#ee0a24', marginLeft: 4, marginRight: 4 }">:</text>
              <view :style="{ backgroundColor: '#ee0a24', borderRadius: 4, paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 }">
                <text :style="{ fontSize: 14, color: '#fff', fontWeight: 'bold' }">{{ formatted.slice(3, 5) }}</text>
              </view>
              <text :style="{ fontSize: 14, color: '#ee0a24', marginLeft: 4, marginRight: 4 }">:</text>
              <view :style="{ backgroundColor: '#ee0a24', borderRadius: 4, paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 }">
                <text :style="{ fontSize: 14, color: '#fff', fontWeight: 'bold' }">{{ formatted.slice(6, 8) }}</text>
              </view>
            </view>
          </template>
        </CountDown>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Manual Control</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown ref="countDownRef" :time="manualTime" :auto-start="false" format="ss" />
        <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 12 }">
          <view
            :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, backgroundColor: '#1989fa', borderRadius: 4 }"
            @tap="onStart"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Start</text>
          </view>
          <view
            :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, backgroundColor: '#ff976a', borderRadius: 4 }"
            @tap="onPause"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Pause</text>
          </view>
          <view
            :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, backgroundColor: '#07c160', borderRadius: 4 }"
            @tap="onReset"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Reset</text>
          </view>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
