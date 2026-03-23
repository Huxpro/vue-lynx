<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  to: string;
  label: string;
  active?: boolean;
}>();
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ navigate }">
    <text
      class="nav-link"
      :class="{ 'router-link-active': active }"
      @tap="navigate"
    >
      {{ label }}
    </text>
  </RouterLink>
</template>
