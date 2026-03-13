<!--
  AsyncSetup.vue — Component with async setup()
  Exercises: top-level await in <script setup>, Suspense integration
-->
<script setup lang="ts">
import { ref } from 'vue-lynx'

// Simulate an async data fetch with top-level await
const data = ref('')

const result = await new Promise<string>((resolve) => {
  setTimeout(() => resolve('Hello from async setup!'), 1500)
})

data.value = result

const loadedAt = new Date().toLocaleTimeString()
</script>

<template>
  <view :style="{ padding: 12, backgroundColor: '#d4edda', borderRadius: 6 }">
    <text :style="{ color: '#155724', fontSize: 14 }">{{ data }}</text>
    <text :style="{ color: '#155724', fontSize: 11, marginTop: 4 }">
      Resolved at: {{ loadedAt }}
    </text>
  </view>
</template>
