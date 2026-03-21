<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PullRefresh from '../components/PullRefresh/index.vue';
const loading = ref(false);
const count = ref(0);

function onRefresh() {
  setTimeout(() => {
    count.value++;
    loading.value = false;
  }, 1000);
}
</script>

<template>
  <DemoPage title="PullRefresh">
    

    <PullRefresh v-model="loading" @refresh="onRefresh">
      <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 14, color: '#969799' }">Pull down to refresh. Count: {{ count }}</text>
      </view>
    </PullRefresh>
  </DemoPage>
</template>
