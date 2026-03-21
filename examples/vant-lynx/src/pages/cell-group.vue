<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Cell from '../components/Cell/index.vue';
</script>

<template>
  <DemoPage title="CellGroup">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Basic Usage</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- Inset Style -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Inset Style</text>
      <CellGroup inset>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- With Title -->
      <CellGroup title="Group 1">
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
      <CellGroup title="Group 2">
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- Inset with Title -->
      <CellGroup title="Inset with Title" inset>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" label="Description" :border="false" />
      </CellGroup>

      <!-- Without Border -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Without Border</text>
      <CellGroup :border="false">
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- Custom Title Slot -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Custom Title Slot</text>
      <CellGroup>
        <template #title>
          <text :style="{ fontSize: 14, color: '#ee0a24', paddingLeft: 16, paddingTop: 16, paddingBottom: 8 }">Custom Group Title</text>
        </template>
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
    </view>
  </DemoPage>
</template>
