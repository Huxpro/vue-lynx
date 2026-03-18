<script setup>
import { ref, computed } from 'vue'

const isReturn = ref(false)
const departureDate = ref(dateToString(new Date()))
const returnDate = ref(departureDate.value)

const canBook = computed(() =>
  !isReturn.value || returnDate.value > departureDate.value
)

function toggleFlightType() {
  isReturn.value = !isReturn.value
}

function book() {
  if (isReturn.value) {
    console.log(`Booked return flight: depart ${departureDate.value}, return ${returnDate.value}`)
  } else {
    console.log(`Booked one-way flight: depart ${departureDate.value}`)
  }
}

function dateToString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<template>
  <view :style="{ padding: '20px', gap: '12px' }">
    <!-- Flight type toggle (simulated select) -->
    <view
      :style="{ padding: '8px 16px', backgroundColor: '#eee', borderRadius: '6px' }"
      @tap="toggleFlightType"
    >
      <text :style="{ fontSize: '16px' }">{{ isReturn ? 'Return Flight' : 'One-way Flight' }}</text>
    </view>

    <!-- Departure date -->
    <view :style="{ gap: '4px' }">
      <text :style="{ fontSize: '12px', color: '#666' }">Departure (YYYY-MM-DD)</text>
      <input
        type="text"
        :value="departureDate"
        :style="{ height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
        @input="(e) => departureDate = e.detail.value"
      />
    </view>

    <!-- Return date -->
    <view :style="{ gap: '4px', opacity: isReturn ? 1 : 0.4 }">
      <text :style="{ fontSize: '12px', color: '#666' }">Return (YYYY-MM-DD)</text>
      <input
        type="text"
        :value="returnDate"
        :style="{ height: '36px', borderWidth: '1px', borderColor: isReturn ? '#ccc' : '#eee', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
        @input="(e) => { if (isReturn) returnDate = e.detail.value }"
      />
    </view>

    <!-- Book button -->
    <view
      :style="{
        padding: '10px 20px',
        backgroundColor: canBook ? '#0077ff' : '#ccc',
        borderRadius: '6px',
        alignSelf: 'flex-start',
      }"
      @tap="canBook && book()"
    >
      <text :style="{ color: '#fff', fontSize: '16px' }">Book</text>
    </view>

    <text v-if="!canBook" :style="{ color: 'red', fontSize: '14px' }">
      Return date must be after departure date.
    </text>
  </view>
</template>
