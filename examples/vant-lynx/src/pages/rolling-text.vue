<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import RollingText from '../components/RollingText/index.vue';
const rollingRef = ref<any>(null);
const manualRef = ref<any>(null);
const targetA = ref(9999);
const targetB = ref(54321);
const targetC = ref(0);
const customTarget = ref(100);

function restartA() {
  targetA.value = 0;
  setTimeout(() => {
    targetA.value = 9999;
  }, 50);
}

function incrementC() {
  targetC.value += Math.floor(Math.random() * 100);
}

function startManual() {
  manualRef.value?.start();
}

function resetManual() {
  manualRef.value?.reset();
}
</script>

<template>
  <DemoPage title="RollingText">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="0" :target-num="targetA" :duration="2000" />
      </view>

      <view
        :style="{
          backgroundColor: '#1989fa',
          borderRadius: 4,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="restartA"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">Restart</text>
      </view>

      <!-- Custom Duration -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Duration (5s)</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="0" :target-num="targetB" :duration="5000" />
      </view>

      <!-- Direction Down -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Direction Down</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="9999" :target-num="0" :duration="3000" direction="down" />
      </view>

      <!-- Custom Height -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Height</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="0" :target-num="customTarget" :duration="2000" :height="60" />
      </view>

      <!-- Direction Up -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Direction Up</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="0" :target-num="9999" :duration="2" direction="up" />
      </view>

      <!-- Set Stop Order -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Set Stop Order</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">ltr (left to right)</text>
        <RollingText :start-num="0" :target-num="54321" :duration="2" stop-order="ltr" />
      </view>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 12, color: '#969799', marginBottom: 4 }">rtl (right to left)</text>
        <RollingText :start-num="0" :target-num="54321" :duration="2" stop-order="rtl" />
      </view>

      <!-- Roll Non-numeric Text -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Roll Non-numeric Text</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :text-list="['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee']" :duration="2" />
      </view>

      <!-- Dynamic Target -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dynamic Target</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText :start-num="0" :target-num="targetC" :duration="1000" />
      </view>
      <view
        :style="{
          backgroundColor: '#07c160',
          borderRadius: 4,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="incrementC"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">Add Random</text>
      </view>

      <!-- Manual Control -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Manual Control</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <RollingText ref="manualRef" :start-num="0" :target-num="12345" :duration="2" :auto-start="false" />
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }">
        <view
          :style="{
            backgroundColor: '#1989fa',
            borderRadius: 4,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 20,
            paddingRight: 20,
            marginRight: 12,
          }"
          @tap="startManual"
        >
          <text :style="{ fontSize: 14, color: '#fff' }">Start</text>
        </view>
        <view
          :style="{
            backgroundColor: '#969799',
            borderRadius: 4,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 20,
            paddingRight: 20,
          }"
          @tap="resetManual"
        >
          <text :style="{ fontSize: 14, color: '#fff' }">Reset</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
