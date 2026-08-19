<script setup lang="ts">
// Test: :global() in <style scoped> (issue #164, PR #381)
//
// Vue lowers `:global(.global-probe)` to a bare `.global-probe` with no
// scope attribute. The split loader routes it through a `common=true`
// sibling request so it lands in common CSS (fragment 0) instead of this
// component's @cssId fragment.
//
// The `.global-probe` element lives in App.vue — OUTSIDE this component —
// so it can only turn teal if the rule truly escaped the scope. The scoped
// `.global-title` rule in the same block must keep working (mixed routing).
</script>

<template>
  <view class="global-card">
    <text class="global-title">:global() — this title must be TEAL (scoped rule intact)</text>
    <text class="global-desc">
      The probe line below this card lives in App.vue and is styled only by a
      :global() rule declared here.
    </text>
  </view>
</template>

<style scoped>
.global-card {
  display: flex;
  flex-direction: column;
  background-color: #e0f2f1;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 4px;
}
.global-title {
  font-size: 15px;
  font-weight: bold;
  color: #00695c;
  margin-bottom: 4px;
}
.global-desc {
  font-size: 12px;
  color: #555;
}
:global(.global-probe) {
  color: #00897b;
  font-size: 13px;
  font-weight: bold;
}
</style>
