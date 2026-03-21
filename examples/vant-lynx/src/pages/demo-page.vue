<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
</script>

<template>
  <DemoPage title="DemoPage">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Wrapper</text>
      <view :style="{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 }">
        <text :style="{ fontSize: 14, color: '#323233' }">
          The DemoPage component provides a consistent page wrapper with a header that includes a back button and a title. It is used as the top-level wrapper for all demo pages.
        </text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Features</text>
      <view :style="{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 }">
        <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">- Accepts a "title" prop for the page header</text>
        <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">- Provides a "Back" button for navigation</text>
        <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">- Uses theme composable for consistent styling</text>
        <text :style="{ fontSize: 14, color: '#323233' }">- Content is placed in the default slot</text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Content Area</text>
      <view :style="{ backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">
          This text is rendered inside the DemoPage default slot. Any content placed here will appear below the header.
        </text>
      </view>
    </view>
  </DemoPage>
</template>
