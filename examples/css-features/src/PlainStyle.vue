<script setup lang="ts">
// Baseline: plain (unscoped) <style> block with class selectors.
// This is the most common pattern in existing vue-lynx examples.
// EXPECTED: Works. CSS is extracted and applied via class selectors.
</script>

<template>
  <view class="plain-card">
    <text class="plain-title">Plain &lt;style&gt; (PlainStyle.vue)</text>
    <text class="plain-desc">Class selectors work via CSS extraction pipeline.</text>
  </view>
</template>

<style>
.plain-card {
  display: flex;
  flex-direction: column;
  background-color: #e8f5e9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.plain-title {
  font-size: 15px;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 4px;
}
.plain-desc {
  font-size: 12px;
  color: #555;
}
</style>
