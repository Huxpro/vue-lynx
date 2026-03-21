<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="Cell">
    

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

      <!-- Left Icon -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Left Icon</text>
      <CellGroup>
        <Cell title="Cell title" icon="location-o" />
        <Cell title="Cell title" icon="like-o" value="Content" :border="false" />
      </CellGroup>

      <!-- Group Title -->
      <CellGroup title="Group 1">
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
      <CellGroup title="Group 2">
        <Cell title="Cell title" value="Content" />
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- Use Slots -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Use Slots</text>
      <CellGroup>
        <Cell>
          <template #title>
            <text :style="{ fontSize: 14, color: '#323233' }">Custom Title <text :style="{ fontSize: 12, color: '#ee0a24' }">Tag</text></text>
          </template>
        </Cell>
        <Cell title="Cell title" :border="false">
          <template #right-icon>
            <Icon name="search" :size="16" color="#969799" />
          </template>
        </Cell>
      </CellGroup>

      <!-- Vertical Center -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Vertical Center</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" label="Description" center :border="false" />
      </CellGroup>

      <!-- Required -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Required</text>
      <CellGroup>
        <Cell title="Cell title" value="Content" required :border="false" />
      </CellGroup>
    </view>
  </DemoPage>
</template>
