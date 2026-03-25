<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  to: string;
  label: string;
  active: boolean;
}>();
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ navigate }">
    <text
      class="filter-link"
      :class="{ selected: active }"
      @tap="navigate"
    >
      {{ label }}
    </text>
  </RouterLink>
</template>
