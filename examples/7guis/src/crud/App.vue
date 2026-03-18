<script setup>
import { ref, reactive, computed, watch } from 'vue'

const names = reactive(['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'])
const selected = ref(-1)
const prefix = ref('')
const first = ref('')
const last = ref('')

const filteredNames = computed(() =>
  names
    .map((n, i) => ({ name: n, index: i }))
    .filter(({ name }) => name.toLowerCase().startsWith(prefix.value.toLowerCase()))
)

watch(selected, (idx) => {
  if (idx >= 0 && idx < names.length) {
    const parts = names[idx].split(', ')
    last.value = parts[0] || ''
    first.value = parts[1] || ''
  }
})

function create() {
  if (first.value.trim() && last.value.trim()) {
    const fullName = `${last.value}, ${first.value}`
    if (!names.includes(fullName)) {
      names.push(fullName)
      first.value = ''
      last.value = ''
    }
  }
}

function update() {
  if (selected.value >= 0 && first.value.trim() && last.value.trim()) {
    names[selected.value] = `${last.value}, ${first.value}`
  }
}

function del() {
  if (selected.value >= 0) {
    names.splice(selected.value, 1)
    selected.value = -1
    first.value = ''
    last.value = ''
  }
}
</script>

<template>
  <view :style="{ padding: '20px', gap: '12px' }">
    <!-- Filter -->
    <view :style="{ gap: '4px' }">
      <text :style="{ fontSize: '12px', color: '#666' }">Filter prefix:</text>
      <input
        type="text"
        :value="prefix"
        placeholder="Filter prefix"
        :style="{ height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
        @input="(e) => prefix = e.detail.value"
      />
    </view>

    <!-- Name list -->
    <view :style="{ borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', minHeight: '120px' }">
      <view
        v-for="item in filteredNames"
        :key="item.index"
        :style="{
          padding: '8px 12px',
          backgroundColor: selected === item.index ? '#0077ff' : 'transparent',
        }"
        @tap="selected = item.index"
      >
        <text :style="{ fontSize: '16px', color: selected === item.index ? '#fff' : '#222' }">
          {{ item.name }}
        </text>
      </view>
    </view>

    <!-- Name / Surname inputs -->
    <view :style="{ gap: '8px' }">
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
        <text :style="{ fontSize: '14px', width: '80px' }">Name:</text>
        <input
          type="text"
          :value="first"
          :style="{ flex: 1, height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
          @input="(e) => first = e.detail.value"
        />
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
        <text :style="{ fontSize: '14px', width: '80px' }">Surname:</text>
        <input
          type="text"
          :value="last"
          :style="{ flex: 1, height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
          @input="(e) => last = e.detail.value"
        />
      </view>
    </view>

    <!-- Action buttons -->
    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
      <view
        :style="{ padding: '8px 16px', backgroundColor: '#0077ff', borderRadius: '6px' }"
        @tap="create"
      >
        <text :style="{ color: '#fff', fontSize: '14px' }">Create</text>
      </view>
      <view
        :style="{ padding: '8px 16px', backgroundColor: selected >= 0 ? '#0077ff' : '#ccc', borderRadius: '6px' }"
        @tap="update"
      >
        <text :style="{ color: '#fff', fontSize: '14px' }">Update</text>
      </view>
      <view
        :style="{ padding: '8px 16px', backgroundColor: selected >= 0 ? '#ff4444' : '#ccc', borderRadius: '6px' }"
        @tap="del"
      >
        <text :style="{ color: '#fff', fontSize: '14px' }">Delete</text>
      </view>
    </view>
  </view>
</template>
