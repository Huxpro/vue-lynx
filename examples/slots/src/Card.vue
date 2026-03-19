<script setup lang="ts">
// Card component with default, header, and footer slots.
</script>

<template>
  <view
    :style="{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      overflow: 'hidden',
    }"
  >
    <!-- Named slot: header (with fallback) -->
    <view :style="{ padding: '8px 12px', backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#eee' }">
      <slot name="header">
        <text :style="{ fontSize: 14, color: '#aaa' }">Default Header</text>
      </slot>
    </view>

    <!-- Default slot: body -->
    <view :style="{ padding: 12 }">
      <slot />
    </view>

    <!-- Named slot: footer (with fallback) -->
    <view :style="{ padding: '6px 12px', backgroundColor: '#fafafa', borderTopWidth: 1, borderColor: '#eee' }">
      <slot name="footer">
        <text :style="{ fontSize: 11, color: '#ccc' }">Default Footer</text>
      </slot>
    </view>
  </view>
</template>
