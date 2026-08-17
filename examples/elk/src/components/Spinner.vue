<script setup lang="ts">
// Elk uses an animated SVG ring; a CSS rotation on a partial border circle
// is the Lynx equivalent.
</script>

<template>
  <view class="spinner" />
</template>

<style>
.spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(204, 125, 36, 0.25);
  border-top-color: #cc7d24;
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
