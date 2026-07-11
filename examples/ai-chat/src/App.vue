<script setup lang="ts">
import { computed } from 'vue-lynx';

import './App.css';
import { useColorMode } from './composables/useColorMode';

const { colorMode } = useColorMode();

const themeClass = computed(() => `theme-${colorMode.value}`);
</script>

<template>
  <view class="root w-full h-full bg-page" :class="[themeClass, 'font-sans']">
    <RouterView />
  </view>
</template>

<style>
.root {
  display: flex;
  flex-direction: row;
}
</style>
