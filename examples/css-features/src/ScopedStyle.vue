<script setup lang="ts">
// Test: <style scoped>
//
// Vue's scoped CSS works by:
//   1. Adding a unique `data-v-{hash}` attribute to each element in the template
//   2. Appending `[data-v-{hash}]` attribute selectors to each CSS rule
//
// EXPECTED ISSUE: Lynx's CSS engine only supports class selectors and
// descendant/child combinators. Attribute selectors like [data-v-xxx] are
// NOT supported. Therefore, scoped CSS rules will be silently ignored.
//
// Additionally, vue-lynx's renderer does NOT implement `setScopeId()` in its
// nodeOps, so `data-v-*` attributes are never set on elements in the first place.
</script>

<template>
  <view class="scoped-card">
    <text class="scoped-title">&lt;style scoped&gt; (ScopedStyle.vue)</text>
    <text class="scoped-desc">
      Uses [data-v-xxx] attribute selectors internally.
      Lynx CSS engine does not support attribute selectors,
      so these styles will NOT be applied.
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
