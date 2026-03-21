<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const components = [
  { name: 'Button', path: '/button' },
  { name: 'Cell', path: '/cell' },
  { name: 'Icon', path: '/icon' },
  { name: 'Image', path: '/image' },
  { name: 'Loading', path: '/loading' },
  { name: 'Tag', path: '/tag' },
  { name: 'Badge', path: '/badge' },
  { name: 'Divider', path: '/divider' },
  { name: 'Space', path: '/space' },
  { name: 'Layout', path: '/layout' },
];

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column' }">
    <text :style="{
      fontSize: 20,
      fontWeight: 'bold',
      padding: 16,
      color: '#323233',
      backgroundColor: '#fff',
    }">
      Vant Lynx
    </text>
    <text :style="{
      fontSize: 14,
      color: '#969799',
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 12,
      backgroundColor: '#fff',
    }">
      Mobile UI Components for Lynx
    </text>

    <view :style="{ padding: 12, display: 'flex', flexDirection: 'column' }">
      <view
        v-for="comp in components"
        :key="comp.name"
        :style="{
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 16,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }"
        @tap="navigate(comp.path)"
      >
        <text :style="{ fontSize: 16, color: '#323233' }">{{ comp.name }}</text>
        <text :style="{ fontSize: 14, color: '#969799' }">></text>
      </view>
    </view>
  </view>
</template>
