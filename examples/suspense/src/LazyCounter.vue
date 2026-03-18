<script setup lang="ts">
import { ref } from 'vue-lynx'

const count = ref(0)

function onTap() {
  count.value++
}
</script>

<template>
  <view :style="{ padding: '12px', backgroundColor: '#cce5ff', borderRadius: '6px', display: 'flex', flexDirection: 'column' }">
    <text :style="{ color: '#004085', fontSize: '14px' }">
      Lazy-loaded counter: {{ count }}
    </text>
    <view
      :style="{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#004085', borderRadius: '6px' }"
      @tap="onTap"
    >
      <text :style="{ color: '#fff', fontSize: '13px' }">Tap to increment</text>
    </view>
  </view>
</template>
