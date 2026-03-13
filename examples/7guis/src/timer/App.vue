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
  <view :style="{ padding: 20, gap: 14 }">
    <!-- Progress bar -->
    <view :style="{ gap: 4 }">
      <text :style="{ fontSize: 14, color: '#666' }">Elapsed Time:</text>
      <view :style="{ height: 20, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }">
        <view
          :style="{
            height: 20,
            width: progressPct + '%',
            backgroundColor: '#0077ff',
            borderRadius: 4,
          }"
        />
      </view>
    </view>

    <text :style="{ fontSize: 20 }">{{ (elapsed / 1000).toFixed(1) }}s</text>

    <!-- Duration control -->
    <view :style="{ gap: 4 }">
      <text :style="{ fontSize: 14, color: '#666' }">
        Duration: {{ (duration / 1000).toFixed(1) }}s
      </text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
        <view
          :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: 4 }"
          @tap="adjustDuration(-1000)"
        >
          <text :style="{ fontSize: 16 }">-1s</text>
        </view>
        <view
          :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: 4 }"
          @tap="adjustDuration(1000)"
        >
          <text :style="{ fontSize: 16 }">+1s</text>
        </view>
      </view>
    </view>

    <!-- Reset -->
    <view
      :style="{ padding: '10px 20px', backgroundColor: '#0077ff', borderRadius: 6, alignSelf: 'flex-start' }"
      @tap="reset"
    >
      <text :style="{ color: '#fff', fontSize: 16 }">Reset</text>
    </view>
  </view>
</template>
