<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DropdownMenu from '../components/DropdownMenu/index.vue';
import DropdownItem from '../components/DropdownItem/index.vue';
const sortValue = ref('price_asc');
const categoryValue = ref(0);
const brandValue = ref('all');
const switchValue = ref(false);

const sortOptions = [
  { text: 'Default Sort', value: 'default' },
  { text: 'Price Ascending', value: 'price_asc' },
  { text: 'Price Descending', value: 'price_desc' },
  { text: 'Sales Volume', value: 'sales' },
];

const categoryOptions = [
  { text: 'All Categories', value: 0 },
  { text: 'Electronics', value: 1 },
  { text: 'Clothing', value: 2 },
  { text: 'Food & Drink', value: 3 },
];

const brandOptions = [
  { text: 'All Brands', value: 'all' },
  { text: 'Brand A', value: 'brand_a' },
  { text: 'Brand B', value: 'brand_b' },
  { text: 'Brand C', value: 'brand_c' },
];

const disabledOptions = [
  { text: 'Option A', value: 0 },
  { text: 'Option B', value: 1, disabled: true },
  { text: 'Option C', value: 2, disabled: true },
];
</script>

<template>
  <DemoPage title="DropdownMenu">
    <!-- Basic Usage -->
    <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 8, paddingLeft: 16 }">Basic Usage</text>
    <DropdownMenu>
      <DropdownItem v-model="sortValue" :options="sortOptions" />
      <DropdownItem v-model="categoryValue" :options="categoryOptions" />
    </DropdownMenu>

    <!-- Custom Active Color -->
    <text :style="{ fontSize: 14, color: '#969799', marginTop: 24, marginBottom: 8, paddingLeft: 16 }">Custom Active Color</text>
    <DropdownMenu active-color="#ee0a24">
      <DropdownItem v-model="brandValue" :options="brandOptions" />
      <DropdownItem v-model="categoryValue" :options="categoryOptions" />
    </DropdownMenu>

    <!-- Custom Content -->
    <text :style="{ fontSize: 14, color: '#969799', marginTop: 24, marginBottom: 8, paddingLeft: 16 }">Custom Content</text>
    <DropdownMenu>
      <DropdownItem v-model="sortValue" :options="sortOptions" />
      <DropdownItem title="Filter">
        <view :style="{ padding: 16 }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }">
            <text :style="{ fontSize: 14, color: '#323233', flex: 1 }">Show Only Discounted</text>
            <view
              :style="{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: switchValue ? '#1989fa' : '#ebedf0',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: switchValue ? 22 : 2,
                paddingRight: switchValue ? 2 : 22,
              }"
              @tap="switchValue = !switchValue"
            >
              <view :style="{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }" />
            </view>
          </view>
          <view
            :style="{ backgroundColor: '#ee0a24', borderRadius: 4, paddingTop: 10, paddingBottom: 10, alignItems: 'center' }"
            @tap="() => {}"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Confirm</text>
          </view>
        </view>
      </DropdownItem>
    </DropdownMenu>

    <!-- Disabled -->
    <text :style="{ fontSize: 14, color: '#969799', marginTop: 24, marginBottom: 8, paddingLeft: 16 }">Disabled</text>
    <DropdownMenu>
      <DropdownItem v-model="categoryValue" :options="disabledOptions" />
      <DropdownItem v-model="sortValue" :options="sortOptions" disabled />
    </DropdownMenu>

    <!-- Direction Up -->
    <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 16 }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 8, paddingLeft: 16 }">Direction Up</text>
      <DropdownMenu direction="up">
        <DropdownItem v-model="sortValue" :options="sortOptions" />
        <DropdownItem v-model="brandValue" :options="brandOptions" />
      </DropdownMenu>
    </view>
  </DemoPage>
</template>
