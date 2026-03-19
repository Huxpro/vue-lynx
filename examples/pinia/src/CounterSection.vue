<script setup lang="ts">
import { useCounterStore } from './stores/counter';

const counter = useCounterStore();
</script>

<template>
  <view :style="{ margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
    <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 }">
      Counter Store
    </text>

    <text :style="{ fontSize: 14, color: '#555', marginBottom: 4 }">
      Count: {{ counter.count }}
    </text>
    <text :style="{ fontSize: 14, color: '#555', marginBottom: 12 }">
      Double: {{ counter.doubleCount }}
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
      <text
        :style="{ fontSize: 14, color: '#fff', backgroundColor: '#4CAF50', padding: '6px 16px', borderRadius: 4 }"
        @tap="counter.decrement"
      >
        −
      </text>
      <text
        :style="{ fontSize: 14, color: '#fff', backgroundColor: '#2196F3', padding: '6px 16px', borderRadius: 4 }"
        @tap="counter.increment"
      >
        +
      </text>
      <text
        :style="{ fontSize: 14, color: '#fff', backgroundColor: '#9E9E9E', padding: '6px 16px', borderRadius: 4 }"
        @tap="counter.reset"
      >
        Reset
      </text>
    </view>
  </view>
</template>
