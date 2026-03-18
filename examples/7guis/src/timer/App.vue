<script setup>
import { ref, computed, onUnmounted } from 'vue'

const duration = ref(15000) // ms
const elapsed = ref(0)

let lastTime = Date.now()
const interval = setInterval(() => {
  const now = Date.now()
  const dt = now - lastTime
  lastTime = now
  if (elapsed.value < duration.value) {
    elapsed.value = Math.min(elapsed.value + dt, duration.value)
  }
}, 50)

onUnmounted(() => clearInterval(interval))

const progressPct = computed(() =>
  Math.min(elapsed.value / duration.value, 1) * 100
)

function reset() {
  elapsed.value = 0
  lastTime = Date.now()
}

function adjustDuration(delta) {
  duration.value = Math.max(1000, Math.min(30000, duration.value + delta))
}
</script>

<template>
  <view :style="{ padding: '20px', gap: '14px' }">
    <!-- Progress bar -->
    <view :style="{ gap: '4px' }">
      <text :style="{ fontSize: '14px', color: '#666' }">Elapsed Time:</text>
      <view :style="{ height: '20px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }">
        <view
          :style="{
            height: '20px',
            width: progressPct + '%',
            backgroundColor: '#0077ff',
            borderRadius: '4px',
          }"
        />
      </view>
    </view>

    <text :style="{ fontSize: '20px' }">{{ (elapsed / 1000).toFixed(1) }}s</text>

    <!-- Duration control -->
    <view :style="{ gap: '4px' }">
      <text :style="{ fontSize: '14px', color: '#666' }">
        Duration: {{ (duration / 1000).toFixed(1) }}s
      </text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
        <view
          :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: '4px' }"
          @tap="adjustDuration(-1000)"
        >
          <text :style="{ fontSize: '16px' }">-1s</text>
        </view>
        <view
          :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: '4px' }"
          @tap="adjustDuration(1000)"
        >
          <text :style="{ fontSize: '16px' }">+1s</text>
        </view>
      </view>
    </view>

    <!-- Reset -->
    <view
      :style="{ padding: '10px 20px', backgroundColor: '#0077ff', borderRadius: '6px', alignSelf: 'flex-start' }"
      @tap="reset"
    >
      <text :style="{ color: '#fff', fontSize: '16px' }">Reset</text>
    </view>
  </view>
</template>
