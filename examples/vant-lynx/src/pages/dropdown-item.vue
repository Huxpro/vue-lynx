<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DropdownMenu from '../components/DropdownMenu/index.vue';
import DropdownItem from '../components/DropdownItem/index.vue';

const sortValue = ref<string | number>('default');
const filterValue = ref<string | number>('all');
const disabledValue = ref<string | number>('option1');

const sortOptions = [
  { text: 'Default Sort', value: 'default' },
  { text: 'Price: Low to High', value: 'price-asc' },
  { text: 'Price: High to Low', value: 'price-desc' },
  { text: 'Sales', value: 'sales' },
];

const filterOptions = [
  { text: 'All', value: 'all' },
  { text: 'New Arrivals', value: 'new' },
  { text: 'On Sale', value: 'sale' },
  { text: 'Best Sellers', value: 'best' },
];

const disabledOptions = [
  { text: 'Option 1', value: 'option1' },
  { text: 'Option 2 (Disabled)', value: 'option2', disabled: true },
  { text: 'Option 3', value: 'option3' },
];
</script>

<template>
  <DemoPage title="DropdownItem">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <DropdownMenu>
          <DropdownItem v-model="sortValue" :options="sortOptions" />
          <DropdownItem v-model="filterValue" :options="filterOptions" />
        </DropdownMenu>
      </view>

      <!-- With Custom Title -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Title</text>
      <view :style="{ marginBottom: 24 }">
        <DropdownMenu>
          <DropdownItem v-model="sortValue" title="Sort By" :options="sortOptions" />
          <DropdownItem v-model="filterValue" title="Filter" :options="filterOptions" />
        </DropdownMenu>
      </view>

      <!-- Disabled Item -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Item</text>
      <view :style="{ marginBottom: 24 }">
        <DropdownMenu>
          <DropdownItem v-model="sortValue" :options="sortOptions" />
          <DropdownItem v-model="filterValue" :options="filterOptions" :disabled="true" />
        </DropdownMenu>
      </view>

      <!-- Disabled Options -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Options</text>
      <view :style="{ marginBottom: 24 }">
        <DropdownMenu>
          <DropdownItem v-model="disabledValue" :options="disabledOptions" />
        </DropdownMenu>
      </view>

      <!-- Custom Active Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Active Color</text>
      <view :style="{ marginBottom: 24 }">
        <DropdownMenu active-color="#ee0a24">
          <DropdownItem v-model="sortValue" :options="sortOptions" />
          <DropdownItem v-model="filterValue" :options="filterOptions" />
        </DropdownMenu>
      </view>

      <!-- Direction Up -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Direction Up</text>
      <view :style="{ marginBottom: 24, marginTop: 200 }">
        <DropdownMenu direction="up">
          <DropdownItem v-model="sortValue" :options="sortOptions" />
          <DropdownItem v-model="filterValue" :options="filterOptions" />
        </DropdownMenu>
      </view>
    </view>
  </DemoPage>
</template>
