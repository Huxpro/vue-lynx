<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToUsers() {
  router.push('/users');
}
</script>

<template>
  <view :style="{ padding: '16px' }">
    <text :style="{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }">
      Home
    </text>
    <text :style="{ fontSize: '14px', color: '#555', marginBottom: '16px', lineHeight: '20px' }">
      This example demonstrates Vue Router with createMemoryHistory in Lynx.
      Since Lynx has no browser navigation APIs, memory history keeps the
      routing state entirely in-process.
    </text>
    <text
      @tap="goToUsers"
      :style="{
        fontSize: '14px',
        color: '#1a73e8',
        padding: '8px 16px',
        backgroundColor: '#e8f0fe',
        borderRadius: '8px',
        alignSelf: 'flex-start',
      }"
    >
      Browse Users →
    </text>
  </view>
</template>
