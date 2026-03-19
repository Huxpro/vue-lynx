<script setup lang="ts" generic="T extends { id: number }">
/**
 * Generic component (Vue 3.3+).
 *
 * The `generic` attribute on <script setup> lets you parameterize
 * a component's props, emits, and slots over a type variable.
 *
 * Usage:
 *   <GenericList :items="users" :label="u => u.name" @select="onSelect" />
 *
 * TypeScript will infer T from the `items` prop and enforce that
 * `label` and `@select` use the same T.
 */

const props = defineProps<{
  items: T[];
  label: (item: T) => string;
}>()

const emit = defineEmits<{
  select: [item: T];
}>()
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: 4 }">
    <view
      v-for="item in props.items"
      :key="item.id"
      :style="{
        padding: '8px 12px',
        backgroundColor: '#fff',
        borderRadius: 6,
      }"
      @tap="emit('select', item)"
    >
      <text :style="{ fontSize: 14, color: '#333' }">
        {{ props.label(item) }}
      </text>
    </view>
  </view>
</template>
