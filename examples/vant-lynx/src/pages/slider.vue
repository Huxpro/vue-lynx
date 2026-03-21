<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Slider from '../components/Slider/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const basicValue = ref(30);
const customColorValue = ref(60);
const disabledValue = ref(50);
const stepValue = ref(20);
const verticalValue = ref(40);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Slider</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Slider v-model="basicValue" />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8, textAlign: 'center' }">Value: {{ basicValue }}</text>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Slider
          v-model="customColorValue"
          active-color="#ee0a24"
          inactive-color="#fad0d0"
        />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8, textAlign: 'center' }">Value: {{ customColorValue }}</text>
      </view>

      <!-- Custom Button Size & Bar Height -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Slider
          v-model="verticalValue"
          :bar-height="4"
          :button-size="32"
        />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8, textAlign: 'center' }">Value: {{ verticalValue }}</text>
      </view>

      <!-- Step -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Step (10)</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Slider
          v-model="stepValue"
          :step="10"
        />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8, textAlign: 'center' }">Value: {{ stepValue }}</text>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Slider v-model="disabledValue" disabled />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8, textAlign: 'center' }">Disabled ({{ disabledValue }})</text>
      </view>
    </view>
  </view>
</template>
