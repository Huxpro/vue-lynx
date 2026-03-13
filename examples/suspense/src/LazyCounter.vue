<!--
  LazyCounter.vue — Lazy-loaded component via defineAsyncComponent
  Exercises: code-splitting, Suspense with dynamic import
-->
<script setup lang="ts">
import { ref } from 'vue-lynx'

const count = ref(0)

function onTap() {
  count.value++
}
</script>

<template>
  <view :style="{ padding: 12, backgroundColor: '#cce5ff', borderRadius: 6, display: 'flex', flexDirection: 'column' }">
    <text :style="{ color: '#004085', fontSize: 14 }">
      Lazy-loaded counter: {{ count }}
    </text>
    <view
      :style="{ marginTop: 8, padding: '6px 12px', backgroundColor: '#004085', borderRadius: 6 }"
      @tap="onTap"
    >
      <text :style="{ color: '#fff', fontSize: 13 }">Tap to increment</text>
    </view>
  </view>
</template>
