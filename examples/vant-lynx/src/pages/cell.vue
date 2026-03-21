<script setup lang="ts">
import { useRouter } from 'vue-router';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Cell</text>
    </view>

    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Basic Usage</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" label="Description" :border="false" />
      </CellGroup>

      <!-- Inset Grouped -->
      <CellGroup title="Inset Grouped" inset>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" label="Description" :border="false" />
      </CellGroup>

      <!-- Size -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Size</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" size="large" />
        <Cell title="Cell title" value="Content" size="large" label="Description" :border="false" />
      </CellGroup>

      <!-- Link -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Link</text>
      <CellGroup>
        <Cell title="Cell title" is-link />
        <Cell title="Cell title" value="Content" is-link />
        <Cell title="Cell title" is-link arrow-direction="down" :border="false" />
      </CellGroup>

      <!-- Required -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Required</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" required :border="false" />
      </CellGroup>
    </view>
  </view>
</template>
