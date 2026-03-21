<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Empty from '../components/Empty/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Empty</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Default</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="error" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Network</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="network" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Search</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="search" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Description</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="default" description="Custom description text" />
      </view>
    </view>
  </view>
</template>
