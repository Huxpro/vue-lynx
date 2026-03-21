<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import TextEllipsis from '../components/TextEllipsis/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const longText = 'Vant is a lightweight, customizable mobile component library that was open sourced in 2017. Over the years, we have been iterating and optimizing its components, and striving to provide developers with an excellent development experience.';
const shortText = 'This is a short text.';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">TextEllipsis</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <TextEllipsis :content="longText" :rows="1" />
      </view>

      <!-- Expand & Collapse -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Expand &amp; Collapse</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <TextEllipsis
          :content="longText"
          :rows="1"
          expand-text="Expand"
          collapse-text="Collapse"
        />
      </view>

      <!-- Multiple Rows -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Multiple Rows</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <TextEllipsis
          :content="longText"
          :rows="3"
          expand-text="Expand"
          collapse-text="Collapse"
        />
      </view>

      <!-- Custom Dots -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Dots</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <TextEllipsis :content="longText" :rows="1" dots=" [...]" />
      </view>

      <!-- Short Text (no truncation) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Short Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <TextEllipsis :content="shortText" :rows="1" expand-text="Expand" />
      </view>
    </view>
  </view>
</template>
