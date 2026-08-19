<script setup vapor lang="ts">
import { ref } from 'vue'
import Counter from './Counter.vue'

const title = ref('Vue Vapor × Lynx')
const history = ref<number[]>([])
const note = ref('')

function onCounterIncrement(value: number) {
  history.value.push(value)
  if (history.value.length > 5) history.value.shift()
}
</script>

<template>
  <view class="page">
    <!-- interpolation -->
    <text class="title">{{ title }}</text>
    <text class="subtitle">rendered without a Virtual DOM</text>

    <!-- child vapor component with props and event -->
    <Counter :initial-count="0" @increment="onCounterIncrement" />

    <!-- v-model -->
    <input class="note-input" placeholder="type a note…" v-model="note" />
    <text v-if="note" class="note">note: {{ note }}</text>

    <!-- v-if + v-for -->
    <view v-if="history.length > 0" class="history">
      <text class="history-label">History:</text>
      <view v-for="(val, idx) in history" :key="idx" class="history-item">
        <text class="history-text">#{{ idx + 1 }}: {{ val }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin: 16px 16px 2px 16px;
  color: #111;
}
.subtitle {
  font-size: 12px;
  color: #42b883;
  margin: 0 16px 12px 16px;
}
.note-input {
  margin: 0 16px 8px 16px;
  padding: 6px 10px;
  background-color: #fff;
  border-radius: 6px;
  font-size: 13px;
}
.note {
  font-size: 12px;
  color: #555;
  margin: 0 16px 12px 16px;
}
.history {
  margin: 0 16px;
}
.history-label {
  font-size: 13px;
  color: #555;
  margin-bottom: 4px;
}
.history-item {
  padding: 2px 8px;
  margin-bottom: 2px;
  background-color: #fff;
  border-radius: 4px;
}
.history-text {
  font-size: 12px;
  color: #333;
}
</style>
