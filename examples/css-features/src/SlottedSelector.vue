<script setup lang="ts">
// Test: :slotted() — the parent side. The slotted <text> below is authored by
// THIS component, so Vue tags it with SlotHost's `-s` scope at runtime.
// SlotHost's `:slotted(.slot-item)` rule must color it purple.
import SlotHost from './SlotHost.vue'
</script>

<template>
  <view class="slotted-card">
    <text class="slotted-title">:slotted()</text>
    <SlotHost>
      <text class="slot-item">:slotted() — should be PURPLE if :slotted() works</text>
    </SlotHost>
  </view>
</template>

<style scoped>
.slotted-card {
  display: flex;
  flex-direction: column;
  background-color: #f3e5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.slotted-title {
  font-size: 15px;
  font-weight: bold;
  color: #4a148c;
  margin-bottom: 4px;
}
</style>
