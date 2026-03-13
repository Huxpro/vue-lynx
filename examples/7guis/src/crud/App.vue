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
  <view :style="{ padding: 20, gap: 12 }">
    <!-- Filter -->
    <view :style="{ gap: 4 }">
      <text :style="{ fontSize: 12, color: '#666' }">Filter prefix:</text>
      <input
        type="text"
        :value="prefix"
        placeholder="Filter prefix"
        :style="{ height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
        @input="(e) => prefix = e.detail.value"
      />
    </view>

    <!-- Name list -->
    <view :style="{ borderWidth: 1, borderColor: '#ccc', borderRadius: 4, minHeight: 120 }">
      <view
        v-for="item in filteredNames"
        :key="item.index"
        :style="{
          padding: '8px 12px',
          backgroundColor: selected === item.index ? '#0077ff' : 'transparent',
        }"
        @tap="selected = item.index"
      >
        <text :style="{ fontSize: 16, color: selected === item.index ? '#fff' : '#222' }">
          {{ item.name }}
        </text>
      </view>
    </view>

    <!-- Name / Surname inputs -->
    <view :style="{ gap: 8 }">
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }">
        <text :style="{ fontSize: 14, width: 80 }">Name:</text>
        <input
          type="text"
          :value="first"
          :style="{ flex: 1, height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
          @input="(e) => first = e.detail.value"
        />
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }">
        <text :style="{ fontSize: 14, width: 80 }">Surname:</text>
        <input
          type="text"
          :value="last"
          :style="{ flex: 1, height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
          @input="(e) => last = e.detail.value"
        />
      </view>
    </view>

    <!-- Action buttons -->
    <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
      <view
        :style="{ padding: '8px 16px', backgroundColor: '#0077ff', borderRadius: 6 }"
        @tap="create"
      >
        <text :style="{ color: '#fff', fontSize: 14 }">Create</text>
      </view>
      <view
        :style="{ padding: '8px 16px', backgroundColor: selected >= 0 ? '#0077ff' : '#ccc', borderRadius: 6 }"
        @tap="update"
      >
        <text :style="{ color: '#fff', fontSize: 14 }">Update</text>
      </view>
      <view
        :style="{ padding: '8px 16px', backgroundColor: selected >= 0 ? '#ff4444' : '#ccc', borderRadius: 6 }"
        @tap="del"
      >
        <text :style="{ color: '#fff', fontSize: 14 }">Delete</text>
      </view>
    </view>
  </view>
</template>
