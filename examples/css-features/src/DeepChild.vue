<script setup lang="ts">
// Deliberately style-free child: the ONLY way `.deep-target` below can get
// colored is via the parent's `:deep()` rule (issue #165).
</script>

<template>
  <view class="deep-child-root">
    <text class="deep-target">:deep() — should be RED if :deep() works</text>
  </view>
</template>
