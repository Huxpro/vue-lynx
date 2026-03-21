<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Barrage from '../components/Barrage/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

interface BarrageItem {
  id?: number | string;
  text: string;
}

const barrageList = ref<BarrageItem[]>([
  { id: 1, text: 'Hello Lynx!' },
  { id: 2, text: 'Vue is awesome' },
  { id: 3, text: 'Vant UI' },
  { id: 4, text: 'Barrage component' },
  { id: 5, text: 'Open source' },
]);

let msgCounter = barrageList.value.length + 1;

const comments = [
  'Nice!',
  'Great work!',
  'Awesome!',
  'Love it!',
  'Hello World',
  'Keep going!',
  'Brilliant!',
];

function addBarrage() {
  const text = comments[msgCounter % comments.length];
  barrageList.value = [
    ...barrageList.value,
    { id: msgCounter, text },
  ];
  msgCounter++;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Barrage</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Demo video-like area with barrage overlay -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Barrage Demo</text>
      <view :style="{ backgroundColor: '#1a1a2e', borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 200, position: 'relative' }">
        <!-- Fake video background -->
        <view :style="{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }">
          <text :style="{ fontSize: 48, color: '#333' }">&#9654;</text>
        </view>

        <!-- Barrage overlay -->
        <Barrage
          v-model="barrageList"
          :rows="4"
          :duration="4000"
          :delay="600"
          :auto-play="true"
        />
      </view>

      <!-- Add barrage button -->
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">
          Active messages: {{ barrageList.length }}
        </text>
        <view
          :style="{
            backgroundColor: '#1989fa',
            borderRadius: 4,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
          @tap="addBarrage"
        >
          <text :style="{ fontSize: 14, color: '#fff' }">Send Barrage</text>
        </view>
      </view>

      <!-- No autoplay example -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Static (autoPlay off)</text>
      <view :style="{ backgroundColor: '#16213e', borderRadius: 8, overflow: 'hidden', height: 100 }">
        <Barrage
          :model-value="[{ text: 'Static barrage 1' }, { text: 'Static barrage 2' }]"
          :auto-play="false"
          :rows="2"
        />
      </view>
    </view>
  </view>
</template>
