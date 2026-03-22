<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
</script>

<template>
  <DemoPage title="CellGroup">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Basic Usage</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" label="Description" :border="false" />
      </CellGroup>

      <!-- Inset Grouped -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Inset Grouped</text>
      <CellGroup inset>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" label="Description" :border="false" />
      </CellGroup>

      <!-- Group Title -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Group Title</text>
      <CellGroup title="Group 1">
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
      <CellGroup title="Group 2">
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
    </view>
  </DemoPage>
</template>
