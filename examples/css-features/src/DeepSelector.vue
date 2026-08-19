<script setup lang="ts">
// Test: :deep() in <style scoped> (issue #165, PR #379)
//
// Vue compiles `.deep-wrap :deep(.deep-target)` to
// `.deep-wrap[data-v-x] .deep-target`. The build routes this rule to the
// common CSS fragment as `.deep-wrap.v-x .deep-target`, and the runtime adds
// the `v-x` scope class, so the rule can reach into DeepChild.
//
// Control: `.deep-target` OUTSIDE `.deep-wrap` must stay gray — the rule is
// still scoped by the ancestor `.deep-wrap.v-x` compound.
import DeepChild from './DeepChild.vue'
</script>

<template>
  <view class="deep-card">
    <text class="deep-title">:deep()</text>
    <view class="deep-wrap">
      <DeepChild />
    </view>
    <!-- Same class, same component, but not under .deep-wrap. -->
    <text class="deep-target">control — must stay GRAY (not red)</text>
  </view>
</template>

<style scoped>
.deep-card {
  display: flex;
  flex-direction: column;
  background-color: #ffebee;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.deep-title {
  font-size: 15px;
  font-weight: bold;
  color: #b71c1c;
  margin-bottom: 4px;
}
.deep-wrap :deep(.deep-target) {
  color: #d32f2f;
  font-size: 13px;
}
.deep-target {
  font-size: 12px;
  color: #9e9e9e;
}
</style>
