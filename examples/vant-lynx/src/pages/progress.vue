<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Progress from '../components/Progress/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const percentage = ref(50);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Progress</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Stroke Width</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" :stroke-width="8" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Inactive</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" :show-pivot="false" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="25" color="#ee0a24" />
        <view :style="{ height: 12 }" />
        <Progress :percentage="50" color="#7232dd" />
        <view :style="{ height: 12 }" />
        <Progress :percentage="75" color="#07c160" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Pivot Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="percentage" pivot-text="Orange" color="#f2826a" />
      </view>
    </view>
  </view>
</template>
