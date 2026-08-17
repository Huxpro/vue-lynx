<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Collapse from '../components/Collapse/index.vue';
import CollapseItem from '../components/CollapseItem/index.vue';

const activeNames = ref([1]);
const activeAccordion = ref(1);
const activeCustom = ref<number[]>([]);
const activeDisabled = ref<number[]>([1]);
const activeCustomTitle = ref<number[]>([]);
const activeToggleAll = ref([1, 2, 3]);
const collapseRef = ref<InstanceType<typeof Collapse> | null>(null);

function toggleAll(expanded: boolean) {
  collapseRef.value?.toggleAll(expanded);
}
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

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse v-model="activeDisabled">
          <CollapseItem title="Title 1" :name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 1.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" :name="2" disabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 2.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" :name="3" disabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 3.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Custom Title -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Title</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse v-model="activeCustomTitle">
          <CollapseItem :name="1">
            <template #title>
              <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
                <text :style="{ fontSize: 14, color: '#323233' }">Title 1 </text>
                <view :style="{ backgroundColor: '#ee0a24', borderRadius: 8, paddingTop: 1, paddingBottom: 1, paddingLeft: 6, paddingRight: 6, marginLeft: 6 }">
                  <text :style="{ fontSize: 10, color: '#fff' }">Hot</text>
                </view>
              </view>
            </template>
            <text :style="{ fontSize: 14, color: '#323233' }">Content with custom title slot.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" :name="2" value="Details" icon="location-o">
            <text :style="{ fontSize: 14, color: '#323233' }">Item with icon and value props.</text>
          </CollapseItem>
        </Collapse>
      </view>

      <!-- Toggle All -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toggle All</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Collapse ref="collapseRef" v-model="activeToggleAll">
          <CollapseItem title="Title 1" :name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 1.</text>
          </CollapseItem>
          <CollapseItem title="Title 2" :name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 2.</text>
          </CollapseItem>
          <CollapseItem title="Title 3" :name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Content of collapse item 3.</text>
          </CollapseItem>
        </Collapse>
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16, backgroundColor: '#1989fa', borderRadius: 4, marginRight: 8 }" @tap="toggleAll(true)">
          <text :style="{ fontSize: 14, color: '#fff' }">Expand All</text>
        </view>
        <view :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16, backgroundColor: '#969799', borderRadius: 4 }" @tap="toggleAll(false)">
          <text :style="{ fontSize: 14, color: '#fff' }">Collapse All</text>
        </view>
      </view>

      <!-- Custom Content (icon, value, label, readonly, large size) -->
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
