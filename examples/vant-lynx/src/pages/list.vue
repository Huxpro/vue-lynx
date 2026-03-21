<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import List from '../components/List/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const loading = ref(false);
const finished = ref(false);
const items = ref<number[]>([]);
const error = ref(false);

function onLoad() {
  // Simulate async data loading
  setTimeout(() => {
    const currentLen = items.value.length;
    for (let i = 0; i < 10; i++) {
      items.value.push(currentLen + i + 1);
    }
    loading.value = false;

    if (items.value.length >= 40) {
      finished.value = true;
    }
  }, 1000);
}

// Error demo
const errorLoading = ref(false);
const errorFinished = ref(false);
const errorItems = ref<number[]>([1, 2, 3, 4, 5]);
const showError = ref(true);

function onErrorLoad() {
  setTimeout(() => {
    errorLoading.value = false;
    showError.value = true;
  }, 1000);
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">List</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', maxHeight: 300 }">
        <List
          v-model:loading="loading"
          :finished="finished"
          finished-text="No more data"
          @load="onLoad"
        >
          <view
            v-for="item in items"
            :key="item"
            :style="{
              padding: 12,
              paddingLeft: 16,
              paddingRight: 16,
              borderBottomWidth: 0.5,
              borderBottomStyle: 'solid',
              borderBottomColor: '#ebedf0',
            }"
          >
            <text :style="{ fontSize: 14, color: '#323233' }">Item {{ item }}</text>
          </view>
        </List>
      </view>

      <!-- Error State -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error Info</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', maxHeight: 250 }">
        <List
          v-model:loading="errorLoading"
          :finished="errorFinished"
          :error="showError"
          error-text="Request failed. Click to reload"
          @load="onErrorLoad"
        >
          <view
            v-for="item in errorItems"
            :key="item"
            :style="{
              padding: 12,
              paddingLeft: 16,
              paddingRight: 16,
              borderBottomWidth: 0.5,
              borderBottomStyle: 'solid',
              borderBottomColor: '#ebedf0',
            }"
          >
            <text :style="{ fontSize: 14, color: '#323233' }">Item {{ item }}</text>
          </view>
        </List>
      </view>
    </view>
  </view>
</template>
