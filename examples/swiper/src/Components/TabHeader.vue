<script setup lang="ts">
defineProps<{
  tabs: string[];
  activeTab: number;
  isFullscreen: boolean;
}>();

const emit = defineEmits<{
  'tab-change': [index: number];
  'toggle-fullscreen': [];
}>();
</script>

<template>
  <view :class="['tab-header', isFullscreen ? 'tab-header-fullscreen' : '']">
    <view class="tab-header-tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-item', index === activeTab ? 'tab-item-active' : '']"
        @tap="emit('tab-change', index)"
      >
        <text
          :class="[
            'tab-item-label',
            index === activeTab ? 'tab-item-label-active' : '',
          ]"
        >
          {{ tab }}
        </text>
        <view
          v-if="index === activeTab"
          class="tab-item-indicator"
        />
      </view>
    </view>
    <view class="tab-header-actions">
      <view class="fullscreen-btn" @tap="emit('toggle-fullscreen')">
        <text class="fullscreen-btn-icon">
          {{ isFullscreen ? '✕' : '⛶' }}
        </text>
      </view>
    </view>
  </view>
</template>
