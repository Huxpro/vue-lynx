<script setup lang="ts">
// Ported from elk: app/components/main/MainContent.vue header — sticky
// title bar with optional back button.
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';

withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  back?: boolean;
}>(), {
  back: false,
});

const router = useRouter();
</script>

<template>
  <view class="page-header">
    <view v-if="back" class="page-header-back" @tap="router.back()">
      <AppIcon name="arrow-left-line" :size="20" color="#232323" />
    </view>
    <view class="page-header-titles">
      <text class="page-header-title">{{ title }}</text>
      <text v-if="subtitle" class="page-header-subtitle">{{ subtitle }}</text>
    </view>
    <slot />
  </view>
</template>

<style>
.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid var(--c-border);
  background-color: var(--c-bg-base);
  flex-shrink: 0;
}

.page-header-back {
  margin-right: 12px;
  padding: 4px;
}

.page-header-titles {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.page-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-base);
}

.page-header-subtitle {
  font-size: 11px;
  color: var(--c-text-secondary);
}
</style>
