<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <view class="flex-1 flex flex-col items-center justify-center">
    <text class="text-muted">Chat {{ route.params.id }}</text>
  </view>
</template>
