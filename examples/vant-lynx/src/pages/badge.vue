<script setup lang="ts">
import { useRouter } from 'vue-router';
import Badge from '../components/Badge/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Badge</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="5">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge :content="10">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge content="Hot">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge dot>
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Max</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="20" :max="9">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge :content="200" :max="99">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="5" color="#1989fa">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge dot color="#1989fa">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>
    </view>
  </view>
</template>
