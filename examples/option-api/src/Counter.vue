<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    initialCount: {
      type: Number,
      default: 0,
    },
  },

  emits: ['increment'],

  data() {
    return {
      count: this.initialCount,
      showDetail: true,
      tapMessage: '',
    }
  },

  computed: {
    buttonColor(): string {
      return this.count > 5 ? '#ff4400' : '#0077ff'
    },
  },

  watch: {
    count(newVal: number) {
      this.tapMessage = `Tapped! Count is now ${newVal}`
    },
  },

  methods: {
    onTap() {
      this.count++
      this.$emit('increment', this.count)
    },
    onToggle() {
      this.showDetail = !this.showDetail
    },
  },
})
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

    <!-- watch result -->
    <text v-if="tapMessage" :style="{ color: '#0077ff', fontSize: '11px', marginTop: '2px' }">
      {{ tapMessage }}
    </text>

    <!-- @tap event, computed property for dynamic style -->
    <view
      :style="{
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: buttonColor,
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
