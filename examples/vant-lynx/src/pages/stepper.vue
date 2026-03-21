<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Stepper from '../components/Stepper/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const value1 = ref(1);
const value2 = ref(1);
const value3 = ref(1);
const value4 = ref(1);
const value5 = ref(1);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Stepper</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value1" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Step Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value2" :step="2" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Range</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value3" :min="5" :max="8" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value4" disabled />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round Theme</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value5" theme="round" />
      </view>
    </view>
  </view>
</template>
