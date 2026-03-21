<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Signature from '../components/Signature/index.vue';
const result = ref('');

function onSubmit(data: { image: string; canvas: any }) {
  if (data.image) {
    result.value = 'Signature captured successfully';
  } else {
    result.value = 'Please sign first';
  }
}

function onClear() {
  result.value = 'Signature cleared';
}
</script>

<template>
  <DemoPage title="Signature">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <!-- Pen Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Pen Color</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          pen-color="#1989fa"
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <!-- Line Width -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Line Width</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          :line-width="6"
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <!-- Background Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Background Color</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          pen-color="#ee0a24"
          background-color="#f7f8fa"
          clear-button-text="Reset"
          confirm-button-text="Done"
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <view v-if="result" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ result }}</text>
      </view>
    </view>
  </DemoPage>
</template>
