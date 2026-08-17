<script setup lang="ts">
import { RouterView } from 'vue-router';
import ConfigProvider from './components/ConfigProvider/index.vue';
import { useTheme } from './composables/useTheme';

const { theme, bgColor } = useTheme();
</script>

<template>
  <ConfigProvider :theme="theme">
    <RouterView />
  </ConfigProvider>
</template>
