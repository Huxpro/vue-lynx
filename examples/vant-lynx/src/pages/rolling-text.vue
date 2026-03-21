<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import RollingText from '../components/RollingText/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const rollingRef = ref<any>(null);
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
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">RollingText</text>
    </view>

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
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="incrementC"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">Add Random</text>
      </view>
    </view>
  </view>
</template>
