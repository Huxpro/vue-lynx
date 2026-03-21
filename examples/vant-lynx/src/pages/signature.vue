<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Signature from '../components/Signature/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Signature</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Pen Color</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Signature
          pen-color="#1989fa"
          :line-width="4"
          @submit="onSubmit"
          @clear="onClear"
        />
      </view>

      <!-- Custom Background -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Background</text>
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
  </view>
</template>
