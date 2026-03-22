<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Highlight from '../components/Highlight/index.vue';

const text =
  'Take your time and be patient. Life itself will eventually answer all those questions it once raised for you.';
</script>

<template>
  <DemoPage title="Highlight">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Basic Usage</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          :source-string="text"
          keywords="questions"
        />
      </view>

      <!-- Multiple Keywords -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Multiple Keywords</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          :source-string="text"
          :keywords="['time', 'life', 'answer']"
        />
      </view>

      <!-- Highlight Class Name -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Highlight Class Name</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Highlight
          :source-string="text"
          keywords="life"
          highlight-class="custom-class"
          highlight-color="red"
        />
      </view>
    </view>
  </DemoPage>
</template>
