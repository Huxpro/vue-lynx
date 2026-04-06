<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Counter from './Counter.vue'

// Tab switching
const tabs = ['Tab A', 'Tab B', 'Tab C'] as const
const activeTab = ref(0)

// Include/exclude demo
const includeList = ref('TabA,TabB')

// Components for dynamic switching
const TabA = { name: 'TabA', ...Counter }
const TabB = { name: 'TabB', ...Counter }
const TabC = { name: 'TabC', ...Counter }
const components = [TabA, TabB, TabC]
const activeComponent = shallowRef(components[0])

function switchTab(index: number) {
  activeTab.value = index
  activeComponent.value = components[index]
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

      <!-- Tab bar -->
      <view :style="{ flexDirection: 'row', marginBottom: '8px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab === i ? '#4a90d9' : '#ddd',
              }">
          <text :style="{ color: activeTab === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
        </view>
      </view>

      <!-- Cached content -->
      <KeepAlive>
        <component :is="activeComponent" :label="tabs[activeTab]" :key="activeTab" />
      </KeepAlive>
    </view>

    <!-- 2. KeepAlive with include -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">2. Include Filter</text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Only Tab A and Tab B are cached. Tab C re-mounts every time.
      </text>

      <view :style="{ flexDirection: 'row', marginBottom: '8px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab === i ? '#e67e22' : '#ddd',
              }">
          <text :style="{ color: activeTab === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
        </view>
      </view>

      <KeepAlive :include="includeList">
        <component :is="activeComponent" :label="tabs[activeTab] + ' (filtered)'" :key="activeTab" />
      </KeepAlive>
    </view>

    <!-- 3. KeepAlive with max -->
    <view :style="{ marginBottom: '24px' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">3. Max Cache Size (max=1)</text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
        Only the most recently visited tab is cached. Older tabs lose their state.
      </text>

      <view :style="{ flexDirection: 'row', marginBottom: '8px' }">
        <view v-for="(tab, i) in tabs" :key="i"
              @tap="switchTab(i)"
              :style="{
                padding: '8px',
                marginRight: '4px',
                borderRadius: '4px',
                backgroundColor: activeTab === i ? '#27ae60' : '#ddd',
              }">
          <text :style="{ color: activeTab === i ? '#fff' : '#333', fontSize: '13px' }">{{ tab }}</text>
        </view>
      </view>

      <KeepAlive :max="1">
        <component :is="activeComponent" :label="tabs[activeTab] + ' (max=1)'" :key="activeTab" />
      </KeepAlive>
    </view>
  </scroll-view>
</template>
