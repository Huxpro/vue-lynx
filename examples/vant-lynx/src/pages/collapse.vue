<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Collapse from '../components/Collapse/index.vue';
import CollapseItem from '../components/CollapseItem/index.vue';

const activeNames = ref([1]);
const activeAccordion = ref(1);
const activeCustom = ref<number[]>([]);
</script>

<template>
  <DemoPage title="Collapse">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse v-model="activeNames">
          <CollapseItem title="Title 1" :name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 1. This section can contain any content you need.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" :name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 2. Tap the header to expand or collapse.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" :name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 3. Multiple items can be expanded at the same time.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Accordion Mode -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Accordion Mode</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse v-model="activeAccordion" accordion>
          <CollapseItem title="Title 1" :name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of accordion item 1. Only one item can be expanded at a time.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" :name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of accordion item 2. Expanding one item will close the other.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" :name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of accordion item 3. This is the accordion behavior.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Custom Content (icon, value, label, disabled, readonly) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Content</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse v-model="activeCustom">
          <CollapseItem
            title="With Icon"
            icon="location"
            value="Details"
            label="Description text"
            :name="1"
          >
            <text :style="{ fontSize: 14, color: '#323233' }">This item has an icon, value, and label.</text>
          </CollapseItem>
          <CollapseItem
            title="Disabled"
            :name="2"
            disabled
          >
            <text :style="{ fontSize: 14, color: '#323233' }">This item is disabled and cannot be toggled.</text>
          </CollapseItem>
          <CollapseItem
            title="Readonly"
            :name="3"
            readonly
          >
            <text :style="{ fontSize: 14, color: '#323233' }">This item is readonly - no arrow, not clickable.</text>
          </CollapseItem>
          <CollapseItem
            title="Large Size"
            :name="4"
            size="large"
            label="Large size item"
          >
            <text :style="{ fontSize: 14, color: '#323233' }">This item uses the large size variant.</text>
          </CollapseItem>
        </Collapse>
      </view>
    </view>
  </DemoPage>
</template>
