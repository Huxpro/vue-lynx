<script setup lang="ts">
// DataList exposes each item via a scoped slot,
// letting the parent fully control rendering.

defineProps<{
  items: Array<{ id: number; name: string; description: string }>;
}>();
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column' }">
    <view v-for="(item, index) in items" :key="item.id">
      <slot name="item" :item="item" :index="index">
        <!-- Fallback: plain text if no scoped slot provided -->
        <text :style="{ fontSize: 13, color: '#333', padding: 4 }">
          {{ item.name }}
        </text>
      </slot>
    </view>
  </view>
</template>
