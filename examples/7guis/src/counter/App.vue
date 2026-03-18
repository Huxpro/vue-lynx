<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <view :style="{ display: 'flex', padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
    <text :style="{ fontSize: '24px', minWidth: '60px' }">{{ count }}</text>
    <view
      :style="{ padding: '8px 20px', backgroundColor: '#0077ff', borderRadius: '6px' }"
      @tap="count++"
    >
      <text :style="{ color: '#fff', fontSize: '16px' }">Count</text>
    </view>
  </view>
</template>
