<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Search from '../components/Search/index.vue';
const basicValue = ref('');
const roundValue = ref('');
const actionValue = ref('');
const labelValue = ref('');
const searchResult = ref('');

function onSearch(val: string) {
  searchResult.value = `Searched: ${val}`;
}

function onCancel() {
  actionValue.value = '';
  searchResult.value = 'Cancelled';
}
</script>

<template>
  <DemoPage title="Search">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Basic Usage</text>
      <Search
        v-model="basicValue"
        placeholder="Search"
        @search="onSearch"
      />

      <!-- Round Shape -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Round Shape</text>
      <Search
        v-model="roundValue"
        shape="round"
        placeholder="Search"
        @search="onSearch"
      />

      <!-- Show Action -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Show Action Button</text>
      <Search
        v-model="actionValue"
        :show-action="true"
        placeholder="Search"
        @search="onSearch"
        @cancel="onCancel"
      />

      <!-- With Label -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">With Label</text>
      <Search
        v-model="labelValue"
        label="Location"
        placeholder="Enter location"
        @search="onSearch"
      />

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Disabled</text>
      <Search
        model-value="Disabled search"
        disabled
        placeholder="Disabled"
      />

      <!-- Result -->
      <view v-if="searchResult" :style="{ margin: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ searchResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
