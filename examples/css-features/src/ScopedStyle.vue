<script setup lang="ts">
// Test: <style scoped>
//
// Vue's scoped CSS is bridged to Lynx's native cssId system:
//   1. Build-time: VueScopedCSSIdPlugin injects ?cssId=<N> so CSS is wrapped in @cssId
//   2. Build-time: vueScopeStripCSSPlugin removes [data-v-xxx] attribute selectors
//   3. Runtime: scope-bridge.ts converts __scopeId to numeric cssId via __SetCSSId
</script>

<template>
  <view class="scoped-card">
    <text class="scoped-title">&lt;style scoped&gt; (ScopedStyle.vue)</text>
    <text class="scoped-desc">
      Bridged to Lynx's native cssId scoping system.
      Styles are scoped to this component only.
    </text>
    <view class="scoped-demo-box">
      <text class="scoped-demo-text">This text should be blue if scoped works</text>
    </view>
  </view>
</template>

<style scoped>
.scoped-card {
  display: flex;
  flex-direction: column;
  background-color: #fff3e0;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.scoped-title {
  font-size: 15px;
  font-weight: bold;
  color: #e65100;
  margin-bottom: 4px;
}
.scoped-desc {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
}
.scoped-demo-box {
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
}
.scoped-demo-text {
  font-size: 13px;
  color: blue;
}
</style>
