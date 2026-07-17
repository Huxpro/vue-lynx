<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

type Item = { id: number; label: string; selected: boolean }
const items = ref<Item[]>([
  { id: 1, label: 'Apple', selected: false },
  { id: 2, label: 'Banana', selected: true },
  { id: 3, label: 'Cherry', selected: false },
])

function bump() {
  count.value++
}

function toggle(id: number) {
  const item = items.value.find((entry) => entry.id === id)
  if (item) item.selected = !item.selected
}

function rename(id: number) {
  const item = items.value.find((entry) => entry.id === id)
  if (!item) return
  item.label = item.label.endsWith('!') ? item.label.slice(0, -1) : `${item.label}!`
}
</script>

<template>
  <scroll-view
    scroll-orientation="vertical"
    :style="{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', padding: '16px' }"
  >
    <text :style="{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }">
      v-once / v-memo
    </text>

    <!-- 1. v-once -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }">
        1. v-once — freeze after first render
      </text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Tap Increment. The live value updates; the v-once value stays at the first render.
      </text>

      <view
        :style="{
          padding: '12px',
          marginBottom: '8px',
          backgroundColor: '#fff',
          borderRadius: '8px',
        }"
      >
        <text :style="{ fontSize: '13px', color: '#333', marginBottom: '4px' }">
          Live: {{ count }}
        </text>
        <text v-once :style="{ fontSize: '13px', color: '#888' }">
          Frozen (v-once): {{ count }}
        </text>
      </view>

      <view
        :style="{
          alignSelf: 'flex-start',
          padding: '8px 14px',
          backgroundColor: '#4a90d9',
          borderRadius: '4px',
        }"
        @tap="bump"
      >
        <text :style="{ color: '#fff', fontSize: '13px' }">Increment</text>
      </view>
    </view>

    <!-- 2. v-memo -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }">
        2. v-memo — skip when deps are unchanged
      </text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Each row memos on `[selected, label]`. Bumping the shared count does not refresh a row;
        toggling or renaming that row does — and the "saw count" value catches up.
      </text>

      <text :style="{ fontSize: '12px', color: '#555', marginBottom: '8px' }">
        Shared count: {{ count }}
      </text>

      <view
        v-for="item in items"
        :key="item.id"
        v-memo="[item.selected, item.label]"
        :style="{
          padding: '12px',
          marginBottom: '8px',
          backgroundColor: item.selected ? '#e8f1fb' : '#fff',
          borderRadius: '8px',
          borderWidth: '1px',
          borderColor: item.selected ? '#4a90d9' : '#e0e0e0',
        }"
      >
        <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }">
          {{ item.label }}
        </text>
        <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
          selected={{ item.selected }} · saw count={{ count }}
        </text>
        <view :style="{ flexDirection: 'row' }">
          <view
            :style="{
              padding: '6px 10px',
              marginRight: '8px',
              backgroundColor: '#4a90d9',
              borderRadius: '4px',
            }"
            @tap="toggle(item.id)"
          >
            <text :style="{ color: '#fff', fontSize: '12px' }">Toggle</text>
          </view>
          <view
            :style="{
              padding: '6px 10px',
              backgroundColor: '#555',
              borderRadius: '4px',
            }"
            @tap="rename(item.id)"
          >
            <text :style="{ color: '#fff', fontSize: '12px' }">Rename</text>
          </view>
        </view>
      </view>

      <view
        :style="{
          alignSelf: 'flex-start',
          padding: '8px 14px',
          backgroundColor: '#27ae60',
          borderRadius: '4px',
        }"
        @tap="bump"
      >
        <text :style="{ color: '#fff', fontSize: '13px' }">Bump shared count</text>
      </view>
    </view>
  </scroll-view>
</template>
