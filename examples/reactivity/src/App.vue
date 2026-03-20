<script setup lang="ts">
import { reactive, toRefs, computed } from 'vue'
import { useStopwatch } from './useStopwatch'

// ── Section 1: reactive() + toRefs() ──
const user = reactive({
  firstName: 'Evan',
  lastName: 'You',
  age: 30,
})

// toRefs() lets you destructure without losing reactivity
const { firstName, lastName, age } = toRefs(user)

const fullName = computed(() => `${firstName.value} ${lastName.value}`)

function birthday() {
  // mutate via the original reactive object — refs stay in sync
  user.age++
}

// ── Section 2: Composable using reactive + toRefs ──
const { elapsed, running, start, stop, reset } = useStopwatch()

const display = computed(() => {
  const tenths = elapsed.value % 10
  const secs = Math.floor(elapsed.value / 10)
  return `${secs}.${tenths}s`
})
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5', padding: 16 }">

    <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 }">
      reactive() + toRefs() + Composables
    </text>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 1: reactive() + toRefs()           -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#0077ff', marginBottom: 4 }">
      1. reactive() + toRefs()
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 2 }">
      Name: {{ fullName }}
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 8 }">
      Age: {{ age }}
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 16 }">
      <view
        :style="{ padding: '6px 12px', backgroundColor: '#0077ff', borderRadius: 4 }"
        @tap="birthday"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">🎂 Birthday</text>
      </view>
      <view
        :style="{ padding: '6px 12px', backgroundColor: '#555', borderRadius: 4 }"
        @tap="() => { user.firstName = user.firstName === 'Evan' ? 'Vue' : 'Evan' }"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Toggle Name</text>
      </view>
    </view>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 2: Composable (useStopwatch)       -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#0077ff', marginBottom: 4 }">
      2. Composable — useStopwatch()
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 8 }">
      Elapsed: {{ display }} {{ running ? '▶' : '⏸' }}
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
      <view
        :style="{ padding: '6px 12px', backgroundColor: running ? '#999' : '#34a853', borderRadius: 4 }"
        @tap="start"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Start</text>
      </view>
      <view
        :style="{ padding: '6px 12px', backgroundColor: running ? '#ea4335' : '#999', borderRadius: 4 }"
        @tap="stop"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Stop</text>
      </view>
      <view
        :style="{ padding: '6px 12px', backgroundColor: '#555', borderRadius: 4 }"
        @tap="reset"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Reset</text>
      </view>
    </view>

  </view>
</template>
