<script setup lang="ts">
// Test: <style scoped> on a component ROOT, inside a scoped parent
//
// Vue hands a component's root element the scope of its own component AND
// the scope of the parent that renders it. On the web those are two
// independent `data-v-*` attributes; Lynx associates an element with exactly
// one cssId, so the root used to end up in the *parent's* CSS fragment and
// the styles below silently stopped matching it (issue #317).
//
// `.nested-root` is styled here, on the root element itself — no wrapper.
</script>

<template>
  <view class="nested-root">
    <text class="nested-text">Root-level scoped styles apply — no wrapper needed</text>
  </view>
</template>

<style scoped>
.nested-root {
  display: flex;
  flex-direction: column;
  background-color: #e8f5e9;
  border-radius: 4px;
  padding: 8px;
}
.nested-text {
  font-size: 12px;
  color: #2e7d32;
}
</style>
