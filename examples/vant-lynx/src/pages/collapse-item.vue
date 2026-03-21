<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Collapse from '../components/Collapse/index.vue';
import CollapseItem from '../components/CollapseItem/index.vue';

const basicActive = ref(['1']);
const disabledActive = ref<string[]>([]);
const customActive = ref(['1']);
const accordionActive = ref('1');
</script>

<template>
  <DemoPage title="CollapseItem">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <Collapse v-model="basicActive">
          <CollapseItem title="Title 1" name="1">
            <text :style="{ fontSize: 14, color: '#969799' }">Content of item 1. This section contains some descriptive text about the first item.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" name="2">
            <text :style="{ fontSize: 14, color: '#969799' }">Content of item 2. This section contains some descriptive text about the second item.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" name="3">
            <text :style="{ fontSize: 14, color: '#969799' }">Content of item 3. This section contains some descriptive text about the third item.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Disabled Item -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Item</text>
      <view :style="{ marginBottom: 24 }">
        <Collapse v-model="disabledActive">
          <CollapseItem title="Normal Item" name="1">
            <text :style="{ fontSize: 14, color: '#969799' }">This item can be toggled normally.</text>
          </CollapseItem>
          <CollapseItem title="Disabled Item" name="2" :disabled="true">
            <text :style="{ fontSize: 14, color: '#969799' }">This item is disabled and cannot be toggled.</text>
          </CollapseItem>
          <CollapseItem title="Readonly Item" name="3" :readonly="true">
            <text :style="{ fontSize: 14, color: '#969799' }">This item is readonly.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Custom Title -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Title</text>
      <view :style="{ marginBottom: 24 }">
        <Collapse v-model="customActive">
          <CollapseItem name="1" icon="shop-o">
            <template #title>
              <text :style="{ fontSize: 14, color: '#1989fa', fontWeight: 'bold' }">Custom Title with Icon</text>
            </template>
            <text :style="{ fontSize: 14, color: '#969799' }">Custom title content using the title slot.</text>
          </CollapseItem>
          <CollapseItem title="With Value" name="2" value="Details">
            <text :style="{ fontSize: 14, color: '#969799' }">This item shows a value on the right side.</text>
          </CollapseItem>
          <CollapseItem title="With Label" name="3" label="A brief description">
            <text :style="{ fontSize: 14, color: '#969799' }">This item has a label below the title.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Accordion Mode -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Accordion Mode</text>
      <view :style="{ marginBottom: 24 }">
        <Collapse v-model="accordionActive" accordion>
          <CollapseItem title="Title 1" name="1">
            <text :style="{ fontSize: 14, color: '#969799' }">Only one item can be expanded at a time in accordion mode.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" name="2">
            <text :style="{ fontSize: 14, color: '#969799' }">Expanding this will close the other.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" name="3">
            <text :style="{ fontSize: 14, color: '#969799' }">Accordion mode keeps only one open.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Large Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Large Size</text>
      <view :style="{ marginBottom: 24 }">
        <Collapse :model-value="['1']">
          <CollapseItem title="Large Item" name="1" size="large">
            <text :style="{ fontSize: 14, color: '#969799' }">This item uses the large size variant.</text>
          </CollapseItem>
        </Collapse>
      </view>
    </view>
  </DemoPage>
</template>
