<script setup lang="ts">
import { useCounterStore } from './stores/counter';

const counter = useCounterStore();
</script>

<template>
  <view :style="{ margin: '16px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }">
    <text :style="{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }">
      Counter Store
    </text>

    <text :style="{ fontSize: '14px', color: '#555', marginBottom: '4px' }">
      Count: {{ counter.count }}
    </text>
    <text :style="{ fontSize: '14px', color: '#555', marginBottom: '12px' }">
      Double: {{ counter.doubleCount }}
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
      <text
        :style="{ fontSize: '14px', color: '#fff', backgroundColor: '#4CAF50', padding: '6px 16px', borderRadius: '4px' }"
        @tap="counter.decrement"
      >
        −
      </text>
      <text
        :style="{ fontSize: '14px', color: '#fff', backgroundColor: '#2196F3', padding: '6px 16px', borderRadius: '4px' }"
        @tap="counter.increment"
      >
        +
      </text>
      <text
        :style="{ fontSize: '14px', color: '#fff', backgroundColor: '#9E9E9E', padding: '6px 16px', borderRadius: '4px' }"
        @tap="counter.reset"
      >
        Reset
      </text>
    </view>
  </view>
</template>
