<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import PullRefresh from '../components/PullRefresh/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">PullRefresh</text>
    </view>

    <PullRefresh v-model="loading" @refresh="onRefresh">
      <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 14, color: '#969799' }">Pull down to refresh. Count: {{ count }}</text>
      </view>
    </PullRefresh>
  </view>
</template>
