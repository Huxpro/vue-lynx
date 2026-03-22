<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTheme } from '../../composables/useTheme';

defineProps<{
  title: string;
}>();

const router = useRouter();
const { bgColor, textColor, textColor2, headerBg } = useTheme();

function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: bgColor }">
    <!-- Header (fixed) -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: headerBg,
    }">
      <text :style="{ fontSize: '16px', color: '#1989fa', marginRight: '8px' }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: '18px', fontWeight: 'bold', color: textColor }">{{ title }}</text>
    </view>

    <!-- Scrollable Content -->
    <scroll-view
      scroll-orientation="vertical"
      :style="{ flex: 1 }"
    >
      <slot />
    </scroll-view>
  </view>
</template>
