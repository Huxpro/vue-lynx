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

      <!-- Size -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Size</text>
      <Cell title="Cell title" value="Content" size="large" />
      <Cell title="Cell title" value="Content" size="large" label="Description" />

      <!-- Left Icon -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Left Icon</text>
      <Cell title="Cell title" value="Content" icon="location-o" :border="false" />

      <!-- Link -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Link</text>
      <CellGroup>
        <Cell title="Cell title" is-link />
        <Cell title="Cell title" value="Content" is-link />
        <Cell title="Cell title" is-link arrow-direction="down" value="Content" :border="false" />
      </CellGroup>

      <!-- Router -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Router</text>
      <CellGroup>
        <Cell title="URL" is-link url="https://github.com" />
        <Cell title="Vue Router" is-link to="/" :border="false" />
      </CellGroup>

      <!-- Group Title -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Group Title</text>
      <CellGroup title="Group 1">
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>
      <CellGroup title="Group 2">
        <Cell title="Cell title" value="Content" :border="false" />
      </CellGroup>

      <!-- Use Slots -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Use Slots</text>
      <CellGroup>
        <Cell value="Content" is-link>
          <template #title>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
              <text :style="{ fontSize: '14px', color: '#323233', marginRight: '4px' }">Cell title</text>
              <view :style="{ backgroundColor: '#1989fa', borderRadius: '2px', paddingLeft: '4px', paddingRight: '4px', paddingTop: '1px', paddingBottom: '1px' }">
                <text :style="{ fontSize: '10px', color: '#fff' }">Tag</text>
              </view>
            </view>
          </template>
        </Cell>
        <Cell title="Cell title" icon="shop-o" :border="false">
          <template #right-icon>
            <Icon name="search" :size="16" color="#969799" />
          </template>
        </Cell>
      </CellGroup>

      <!-- Vertical Center -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Vertical Center</text>
      <Cell center title="Cell title" value="Content" label="Description" :border="false" />
    </view>
  </DemoPage>
</template>
