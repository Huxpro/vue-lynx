<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Highlight from '../components/Highlight/index.vue';
</script>

<template>
  <DemoPage title="Highlight">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Basic Usage</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          source-string="The quick brown fox jumps over the lazy dog"
          keywords="fox"
        />
      </view>

      <!-- Multiple Keywords -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Multiple Keywords</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          source-string="The quick brown fox jumps over the lazy dog"
          :keywords="['quick', 'lazy']"
        />
      </view>

      <!-- Custom Highlight Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Custom Highlight Color</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          source-string="Hello world, hello Lynx!"
          keywords="hello"
          highlight-color="#07c160"
        />
      </view>

      <!-- Case Sensitive -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">Case Sensitive</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 }">
        <Highlight
          source-string="Hello hello HELLO"
          keywords="Hello"
          :case-sensitive="true"
          highlight-color="#ff976a"
        />
      </view>

      <!-- No Match -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8 }">No Match</text>
      <view :style="{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Highlight
          source-string="Nothing to highlight here"
          keywords="xyz"
        />
      </view>
    </view>
  </DemoPage>
</template>
