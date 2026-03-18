<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  to: string;
  label: string;
}>();
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ navigate, isActive }">
    <text
      @tap="navigate"
      :style="{
        fontSize: '14px',
        padding: '8px 12px',
        marginRight: '4px',
        borderRadius: '16px',
        color: isActive ? '#fff' : '#333',
        backgroundColor: isActive ? '#1a73e8' : '#e8e8e8',
      }"
    >
      {{ label }}
    </text>
  </RouterLink>
</template>
