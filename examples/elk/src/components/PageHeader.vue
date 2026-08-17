<script setup lang="ts">
// Ported from elk: app/components/main/MainContent.vue + NavTitle — sticky
// title bar. Elk's timeline headers show a primary-colored icon + title
// pair; subpages show a back arrow + plain title.
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import { currentUser } from '../composables/users';
import AppIcon from './AppIcon.vue';

withDefaults(defineProps<{
  title: string;
  icon?: string;
  back?: boolean;
}>(), {
  back: false,
});

const router = useRouter();
const signInPressed = ref(false);

function goSignIn() {
  router.push('/settings');
}
</script>

<template>
  <view class="page-header">
    <view v-if="back" class="page-header-back" @tap="router.back()">
      <AppIcon name="arrow-left-line" :size="20" color="#232323" />
    </view>
    <AppIcon v-if="icon" :name="icon" :size="22" color="#cc7d24" />
    <text class="page-header-title" :class="icon ? 'page-header-title-primary' : ''" :text-maxline="1">{{ title }}</text>
    <view class="page-header-spacer" />
    <slot />
    <view
      v-if="!currentUser"
      class="page-header-sign-in"
      :class="signInPressed ? 'page-header-sign-in-pressed' : ''"
      @touchstart="signInPressed = true"
      @touchend="signInPressed = false"
      @touchcancel="signInPressed = false"
      @tap="goSignIn"
    >
      <AppIcon name="login-circle-line" :size="17" color="#ffffff" />
      <text class="page-header-sign-in-text">Sign in</text>
    </view>
  </view>
</template>

<style>
.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid var(--c-border);
  background-color: var(--c-bg-base);
  flex-shrink: 0;
  gap: 10px;
}

.page-header-back {
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -10px;
}

.page-header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-text-base);
  flex-shrink: 1;
}

.page-header-title-primary {
  color: var(--c-primary);
}

.page-header-spacer {
  flex: 1;
}

.page-header-sign-in {
  height: 36px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 6px;
  background-color: var(--c-primary);
  flex-shrink: 0;
  transition: transform var(--motion-fast) var(--ease-out-quart), opacity var(--motion-fast) var(--ease-out-quart);
}

.page-header-sign-in-pressed {
  transform: scale(0.96);
  opacity: 0.86;
}

.page-header-sign-in-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}
</style>
