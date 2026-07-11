<script setup lang="ts">
// Ported from elk: app/components/main/MainContent.vue + NavTitle — sticky
// title bar. Elk's timeline headers show a primary-colored icon + title
// pair; subpages show a back arrow + plain title.
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';

withDefaults(defineProps<{
  title: string;
  icon?: string;
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
    <AppIcon v-if="icon" :name="icon" :size="22" color="#cc7d24" />
    <text class="page-header-title" :class="icon ? 'page-header-title-primary' : ''">{{ title }}</text>
    <view class="page-header-spacer" />
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
  gap: 10px;
}

.page-header-back {
  padding: 4px;
}

.page-header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-text-base);
}

.page-header-title-primary {
  color: var(--c-primary);
}

.page-header-spacer {
  flex: 1;
}
</style>
