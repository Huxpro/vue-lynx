<script setup lang="ts">
// Test: :slotted() in <style scoped> (issue #165, PR #379)
//
// Vue compiles `:slotted(.slot-item)` to `.slot-item[data-v-x-s]` and calls
// setScopeId with the `-s` suffixed scope on slot content. The build routes
// the rule to common CSS as `.slot-item.v-x-s`; the runtime must add the
// `v-x-s` class to slotted elements WITHOUT stealing their native cssId.
</script>

<template>
  <view class="slot-host">
    <slot />
    <!-- Same class but authored HERE, not slotted: must stay gray. -->
    <text class="slot-item">control — must stay GRAY (not purple)</text>
  </view>
</template>

<style scoped>
.slot-host {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
}
:slotted(.slot-item) {
  color: #7b1fa2;
  font-size: 13px;
}
.slot-item {
  font-size: 12px;
  color: #9e9e9e;
}
</style>
