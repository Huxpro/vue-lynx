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
  <view :style="{ padding: 20, gap: 12 }">
    <!-- Flight type toggle (simulated select) -->
    <view
      :style="{ padding: '8px 16px', backgroundColor: '#eee', borderRadius: 6 }"
      @tap="toggleFlightType"
    >
      <text :style="{ fontSize: 16 }">{{ isReturn ? 'Return Flight' : 'One-way Flight' }}</text>
    </view>

    <!-- Departure date -->
    <view :style="{ gap: 4 }">
      <text :style="{ fontSize: 12, color: '#666' }">Departure (YYYY-MM-DD)</text>
      <input
        type="text"
        :value="departureDate"
        :style="{ height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
        @input="(e) => departureDate = e.detail.value"
      />
    </view>

    <!-- Return date -->
    <view :style="{ gap: 4, opacity: isReturn ? 1 : 0.4 }">
      <text :style="{ fontSize: 12, color: '#666' }">Return (YYYY-MM-DD)</text>
      <input
        type="text"
        :value="returnDate"
        :style="{ height: 36, borderWidth: 1, borderColor: isReturn ? '#ccc' : '#eee', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
        @input="(e) => { if (isReturn) returnDate = e.detail.value }"
      />
    </view>

    <!-- Book button -->
    <view
      :style="{
        padding: '10px 20px',
        backgroundColor: canBook ? '#0077ff' : '#ccc',
        borderRadius: 6,
        alignSelf: 'flex-start',
      }"
      @tap="canBook && book()"
    >
      <text :style="{ color: '#fff', fontSize: 16 }">Book</text>
    </view>

    <text v-if="!canBook" :style="{ color: 'red', fontSize: 14 }">
      Return date must be after departure date.
    </text>
  </view>
</template>
