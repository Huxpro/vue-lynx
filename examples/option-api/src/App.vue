<script lang="ts">
import { defineComponent } from 'vue'
import Counter from './Counter.vue'

export default defineComponent({
  components: { Counter },

  data() {
    return {
      title: 'Vue 3 × Lynx — Options API Demo',
      history: [] as number[],
      mountedAt: '',
    }
  },

  computed: {
    historyCount(): number {
      return this.history.length
    },
    lastValue(): number | undefined {
      return this.history.length > 0
        ? this.history[this.history.length - 1]
        : undefined
    },
  },

  watch: {
    historyCount(newVal: number) {
      if (newVal > 5) {
        this.history.shift()
      }
    },
  },

  mounted() {
    this.mountedAt = new Date().toLocaleTimeString()
  },

  methods: {
    onCounterIncrement(value: number) {
      this.history.push(value)
    },
  },
})
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <!-- interpolation -->
    <text :style="{ fontSize: 18, fontWeight: 'bold', margin: 16, color: '#111' }">
      {{ title }}
    </text>

    <!-- mounted lifecycle hook result -->
    <text v-if="mountedAt" :style="{ fontSize: 12, color: '#888', marginLeft: 16, marginBottom: 8 }">
      Mounted at: {{ mountedAt }}
    </text>

    <!-- child component registered via components option -->
    <Counter :initial-count="0" @increment="onCounterIncrement" />

    <!-- computed property -->
    <text v-if="lastValue !== undefined" :style="{ fontSize: 13, color: '#555', margin: '0 16px' }">
      Last value: {{ lastValue }} ({{ historyCount }} entries)
    </text>

    <!-- v-for list rendering -->
    <view v-if="history.length > 0" :style="{ margin: '8px 16px' }">
      <text :style="{ fontSize: 13, color: '#555', marginBottom: 4 }">History:</text>
      <view
        v-for="(val, idx) in history"
        :key="idx"
        :style="{
          padding: '2px 8px',
          marginBottom: 2,
          backgroundColor: '#fff',
          borderRadius: 4,
        }"
      >
        <text :style="{ fontSize: 12, color: '#333' }">#{{ idx + 1 }}: {{ val }}</text>
      </view>
    </view>
  </view>
</template>
