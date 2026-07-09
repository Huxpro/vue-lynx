<script setup vapor lang="ts">
import { ref } from 'vue'

const props = defineProps<{ initialCount?: number }>()
const emit = defineEmits<{ increment: [value: number] }>()

const count = ref(props.initialCount ?? 0)

function increment() {
  count.value++
  emit('increment', count.value)
}

function decrement() {
  count.value--
}
</script>

<template>
  <view class="counter">
    <view class="button" @tap="decrement">
      <text class="button-text">−</text>
    </view>
    <text class="count" :class="{ positive: count > 0, negative: count < 0 }">
      {{ count }}
    </text>
    <view class="button" @tap="increment">
      <text class="button-text">+</text>
    </view>
  </view>
</template>

<style scoped>
.counter {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 16px 12px 16px;
}
.button {
  width: 36px;
  height: 36px;
  background-color: #42b883;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.button-text {
  font-size: 20px;
  color: #fff;
}
.count {
  font-size: 18px;
  color: #333;
  margin: 0 16px;
  min-width: 32px;
  text-align: center;
}
.positive {
  color: #42b883;
}
.negative {
  color: #e74c3c;
}
</style>
