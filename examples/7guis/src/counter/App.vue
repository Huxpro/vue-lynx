<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <view :style="{ display: 'flex', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }">
    <text :style="{ fontSize: 24, minWidth: 60 }">{{ count }}</text>
    <view
      :style="{ padding: '8px 20px', backgroundColor: '#0077ff', borderRadius: 6 }"
      @tap="count++"
    >
      <text :style="{ color: '#fff', fontSize: 16 }">Count</text>
    </view>
  </view>
</template>
