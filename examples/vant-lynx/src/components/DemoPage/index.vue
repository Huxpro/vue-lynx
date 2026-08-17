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
  <view :style="{ display: 'flex', flexDirection: 'column', backgroundColor: bgColor }">
    <!-- Header -->
    <view :style="{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: headerBg,
    }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: textColor }">{{ title }}</text>
    </view>

    <!-- Content -->
    <slot />
  </view>
</template>
