<script setup lang="ts">
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <view v-if="show" class="spinner" />
</template>

<style lang="scss">
.spinner {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border-width: 3px;
  border-style: solid;
  border-color: #eee;
  border-top-color: #3eaf7c;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
