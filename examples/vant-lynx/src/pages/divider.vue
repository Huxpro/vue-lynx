<script setup lang="ts">
import { useRouter } from 'vue-router';
import Divider from '../components/Divider/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Divider</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', margin: 16, borderRadius: 8 }">
      <Divider />

      <Divider>
        <text :style="{ fontSize: 14, color: '#969799' }">Text</text>
      </Divider>

      <Divider content-position="left">
        <text :style="{ fontSize: 14, color: '#969799' }">Left Text</text>
      </Divider>

      <Divider content-position="right">
        <text :style="{ fontSize: 14, color: '#969799' }">Right Text</text>
      </Divider>

      <Divider dashed>
        <text :style="{ fontSize: 14, color: '#969799' }">Dashed</text>
      </Divider>
    </view>
  </view>
</template>
