<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  NavLink.vue — Lynx-compatible RouterLink wrapper

  Uses RouterLink's `custom` + v-slot API to render a tappable <text>
  instead of the default <a> tag (which doesn't exist in Lynx).
-->
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
        fontSize: 14,
        padding: '8px 12px',
        marginRight: 4,
        borderRadius: 16,
        color: isActive ? '#fff' : '#333',
        backgroundColor: isActive ? '#1a73e8' : '#e8e8e8',
      }"
    >
      {{ label }}
    </text>
  </RouterLink>
</template>
