<script setup lang="ts">
import { ref, shallowRef, reactive } from 'vue'
import Counter from './Counter.vue'

const tabs = ['Tab A', 'Tab B', 'Tab C'] as const
const tabKeys = ['TabA', 'TabB', 'TabC'] as const

const TabA = { name: 'TabA', ...Counter }
const TabB = { name: 'TabB', ...Counter }
const TabC = { name: 'TabC', ...Counter }
const allComponents = [TabA, TabB, TabC]

// Demo 1 — basic state preservation
const activeTab1 = ref(0)
const activeComp1 = shallowRef(allComponents[0])
function switchTab1(i: number) { activeTab1.value = i; activeComp1.value = allComponents[i] }

// Demo 2 — include filter
const activeTab2 = ref(0)
const activeComp2 = shallowRef(allComponents[0])
function switchTab2(i: number) { activeTab2.value = i; activeComp2.value = allComponents[i] }

// Demo 3 — max=2 with cache status display
const activeTab3 = ref(0)
const activeComp3 = shallowRef(allComponents[0])
function switchTab3(i: number) { activeTab3.value = i; activeComp3.value = allComponents[i] }

type CacheStatus = 'never' | 'active' | 'cached' | 'evicted'
const cacheStatus3 = reactive<Record<string, CacheStatus>>({
  TabA: 'never', TabB: 'never', TabC: 'never',
})

function makeTrackFn(name: string) {
  return (event: string) => {
    if (event === 'mounted' || event === 'activated') cacheStatus3[name] = 'active'
    else if (event === 'deactivated') cacheStatus3[name] = 'cached'
    else if (event === 'unmounted') cacheStatus3[name] = 'evicted'
  }
}
const trackFns: Record<string, (e: string) => void> = {
  TabA: makeTrackFn('TabA'),
  TabB: makeTrackFn('TabB'),
  TabC: makeTrackFn('TabC'),
}

function statusLabel(s: CacheStatus) {
  if (s === 'cached') return 'cached'
  if (s === 'evicted') return 'evicted'
  if (s === 'active') return 'active'
  return '-'
}
function statusColor(s: CacheStatus) {
  if (s === 'cached') return '#2980b9'
  if (s === 'evicted') return '#e74c3c'
  if (s === 'active') return '#27ae60'
  return '#aaa'
}
</script>

<template>
  <scroll-view scroll-orientation="vertical" :style="{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '16px' }">
    <text :style="{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }">KeepAlive Demo</text>

    <!-- 1. Basic KeepAlive — state preservation -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">1. State Preservation</text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Increment the counter, switch tabs, then switch back — the count is preserved.
      </text>

      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab1(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab1 === i ? '#4a90d9' : '#ddd',
              }">
          <text :style="{ color: activeTab1 === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
        </view>
      </view>

      <KeepAlive>
        <component :is="activeComp1" :label="tabs[activeTab1]" :key="activeTab1" />
      </KeepAlive>
    </view>

    <!-- 2. KeepAlive with include -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">2. Include Filter</text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Only Tab A and Tab B are cached. Tab C re-mounts every time.
      </text>

      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab2(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab2 === i ? '#e67e22' : '#ddd',
              }">
          <text :style="{ color: activeTab2 === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
        </view>
      </view>

      <KeepAlive include="TabA,TabB">
        <component :is="activeComp2" :label="tabs[activeTab2] + ' (filtered)'" :key="activeTab2" />
      </KeepAlive>
    </view>

    <!-- 3. KeepAlive with max=2 -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">3. Max Cache Size (max=2)</text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        At most 2 tabs cached. Visit A then B then C — A gets evicted.
      </text>

      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '4px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab3(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab3 === i ? '#27ae60' : '#ddd',
                alignItems: 'center',
              }">
          <text :style="{ color: activeTab3 === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
          <text :style="{ fontSize: '10px', color: activeTab3 === i ? 'rgba(255,255,255,0.85)' : statusColor(cacheStatus3[tabKeys[i]]) }">
            {{ statusLabel(cacheStatus3[tabKeys[i]]) }}
          </text>
        </view>
      </view>

      <KeepAlive :max="2">
        <component
          :is="activeComp3"
          :label="tabs[activeTab3]"
          :on-lifecycle="trackFns[tabKeys[activeTab3]]"
          :key="activeTab3"
        />
      </KeepAlive>
    </view>
  </scroll-view>
</template>
