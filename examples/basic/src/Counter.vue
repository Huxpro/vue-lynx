<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ initialCount?: number }>()
const emit = defineEmits<{ increment: [value: number] }>()

const count = ref(props.initialCount ?? 0)
const showDetail = ref(true)

function onTap() {
  count.value++
  emit('increment', count.value)
}

function onToggle() {
  showDetail.value = !showDetail.value
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', padding: '12px' }">
    <!-- v-if / v-else -->
    <text v-if="count === 0" :style="{ color: '#999', fontSize: '14px' }">
      No taps yet
    </text>
    <text v-else :style="{ fontSize: '22px', color: '#222' }">
      Count: {{ count }}
    </text>

    <!-- v-show -->
    <text v-show="showDetail" :style="{ color: '#666', fontSize: '12px', marginTop: '4px' }">
      (tap the button to increment)
    </text>

    <!-- @tap event, dynamic :style -->
    <view
      :style="{
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: count > 5 ? '#ff4400' : '#0077ff',
        borderRadius: '8px',
      }"
      @tap="onTap"
    >
      <text :style="{ color: '#fff' }">Tap to increment</text>
    </view>

    <!-- toggle detail visibility -->
    <view
      :style="{ marginTop: '6px', padding: '4px 12px', backgroundColor: '#eee', borderRadius: '6px' }"
      @tap="onToggle"
    >
      <text :style="{ color: '#555', fontSize: '12px' }">
        {{ showDetail ? 'Hide' : 'Show' }} detail
      </text>
    </view>
  </view>
</template>
